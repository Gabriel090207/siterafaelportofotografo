import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useClientAuth } from "../../hooks/useClientAuth";
import { LINK_LOGIN_ERROR } from "../../services/api/clientLinkLogin";
import { consumeClientLink } from "./consumeClientLink";
import "../ClientLogin/ClientLogin.css";
import "./ClientLinkAccess.css";

export default function ClientLinkAccess() {
    const navigate = useNavigate();
    const { status, client } = useClientAuth();
    const [targetUid, setTargetUid] = useState<string | null>(null);
    const [failed, setFailed] = useState(false);
    // StrictMode effects attach to the same promise; it resolves only to a UID.
    // No credential, fragment or token is stored in React state/context/storage.
    const attempt = useRef<Promise<string> | null>(null);

    useEffect(() => {
        let subscribed = true;
        if (!attempt.current) attempt.current = consumeClientLink();
        void attempt.current.then(
            (uid) => { if (subscribed) setTargetUid(uid); },
            () => { if (subscribed) setFailed(true); },
        );
        return () => { subscribed = false; };
    }, []);

    useEffect(() => {
        if (!failed && targetUid && status === "authenticated" && client?.uid === targetUid) {
            navigate("/cliente/dashboard", { replace: true });
        }
    }, [targetUid, status, client?.uid, failed, navigate]);

    const unavailable = failed || (targetUid !== null && status === "unauthenticated");
    return (
        <main className="client-login">
            <div className="client-login__card" aria-busy={!unavailable}>
                <span className="client-login__eyebrow">ÁREA DO CLIENTE</span>
                {unavailable ? <>
                    <h1>Não foi possível acessar</h1>
                    <p role="alert">{LINK_LOGIN_ERROR}</p>
                    <div className="client-link-access__actions">
                        <Link className="client-login__submit" to="/cliente" replace>Ir para o login</Link>
                    </div>
                </> : <p role="status" aria-live="polite">Acessando...</p>}
            </div>
        </main>
    );
}
