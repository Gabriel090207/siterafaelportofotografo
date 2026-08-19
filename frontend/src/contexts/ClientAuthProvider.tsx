import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { onIdTokenChanged, type User } from "firebase/auth";

import ClientAuthContext, {
    type ClientAuthStatus,
} from "./ClientAuthContext";
import {
    getClientSession,
    type ClientSessionProfile,
} from "../services/api/clientSession";
import { CLIENT_SESSION_INVALID_EVENT } from "../services/api/clientApi";
import auth, { logoutClient } from "../services/firebase/auth";

interface ClientAuthProviderProps {
    children: ReactNode;
}

const clearLegacyClient = () => {
    localStorage.removeItem("client");
};

export function ClientAuthProvider({ children }: ClientAuthProviderProps) {
    const [status, setStatus] =
        useState<ClientAuthStatus>("initializing");
    const [user, setUser] = useState<User | null>(null);
    const [client, setClient] =
        useState<ClientSessionProfile | null>(null);
    const validationVersionRef = useRef(0);
    const requestControllerRef = useRef<AbortController | null>(null);
    const logoutInProgressRef = useRef(false);

    const clearSessionState = useCallback(() => {
        setUser(null);
        setClient(null);
        setStatus("unauthenticated");
        clearLegacyClient();
    }, []);

    const logout = useCallback(async () => {
        if (logoutInProgressRef.current) return false;

        logoutInProgressRef.current = true;
        validationVersionRef.current += 1;
        requestControllerRef.current?.abort();
        requestControllerRef.current = null;
        clearSessionState();

        try {
            await logoutClient();
            return true;
        } catch (error) {
            console.error("Erro ao encerrar sessão do cliente:", error);
            return false;
        } finally {
            logoutInProgressRef.current = false;
        }
    }, [clearSessionState]);

    useEffect(() => {
        const handleInvalidSession = () => {
            void logout();
        };

        window.addEventListener(
            CLIENT_SESSION_INVALID_EVENT,
            handleInvalidSession
        );

        return () => {
            window.removeEventListener(
                CLIENT_SESSION_INVALID_EVENT,
                handleInvalidSession
            );
        };
    }, [logout]);

    useEffect(() => {
        const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
            validationVersionRef.current += 1;
            const validationVersion = validationVersionRef.current;

            requestControllerRef.current?.abort();
            requestControllerRef.current = null;

            if (!firebaseUser) {
                clearSessionState();
                return;
            }

            setStatus("initializing");
            setUser(firebaseUser);
            setClient(null);

            const controller = new AbortController();
            requestControllerRef.current = controller;

            try {
                const idToken = await firebaseUser.getIdToken();
                const profile = await getClientSession(
                    idToken,
                    controller.signal
                );

                if (
                    validationVersion !== validationVersionRef.current
                    || auth.currentUser?.uid !== firebaseUser.uid
                ) {
                    return;
                }

                clearLegacyClient();
                setUser(firebaseUser);
                setClient(profile);
                setStatus("authenticated");
            } catch (error) {
                if (
                    controller.signal.aborted
                    || validationVersion !== validationVersionRef.current
                ) {
                    return;
                }

                console.error("Erro ao validar sessão do cliente:", error);
                clearSessionState();

                try {
                    await logoutClient();
                } catch (logoutError) {
                    console.error(
                        "Erro ao encerrar sessão inválida do cliente:",
                        logoutError
                    );
                }
            } finally {
                if (requestControllerRef.current === controller) {
                    requestControllerRef.current = null;
                }
            }
        });

        return () => {
            validationVersionRef.current += 1;
            requestControllerRef.current?.abort();
            requestControllerRef.current = null;
            unsubscribe();
        };
    }, [clearSessionState]);

    const value = useMemo(
        () => ({ status, user, client, logout }),
        [client, logout, status, user]
    );

    return (
        <ClientAuthContext.Provider value={value}>
            {children}
        </ClientAuthContext.Provider>
    );
}
