import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import type { ReactNode } from "react";

import {
    onAuthStateChanged,
    signOut,
    signInWithEmailAndPassword,
} from "firebase/auth";

import type { User } from "firebase/auth";

import {
    doc,
    getDoc,
} from "firebase/firestore";

import db from "../services/firebase/firestore";

interface AdminData {
    name: string;
    email: string;
    role: string;
}

import auth from "../services/firebase/auth";

interface AuthContextData {
    user: User | null;
    adminData: AdminData | null;
    loading: boolean;

    login: (
        email: string,
        password: string
    ) => Promise<void>;

    logout: () => Promise<void>;
}

const AuthContext = createContext({} as AuthContextData);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({
    children,
}: AuthProviderProps) => {

    const [user, setUser] = useState<User | null>(null);

    const [adminData, setAdminData] = useState<AdminData | null>(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const unsubscribe = onAuthStateChanged(
    auth,
    async (currentUser) => {

        setUser(currentUser);

        if (currentUser) {

            const adminRef = doc(
                db,
                "admins",
                currentUser.uid
            );

            const adminSnap = await getDoc(adminRef);

            if (adminSnap.exists()) {

                setAdminData(
                    adminSnap.data() as AdminData
                );

            } else {

                setAdminData(null);

            }

        } else {

            setAdminData(null);

        }

        setLoading(false);

    }
);

        return unsubscribe;

    }, []);

   const login = async (
    email: string,
    password: string
) => {

    const credential =
        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

    const adminRef = doc(
        db,
        "admins",
        credential.user.uid
    );

    const adminSnap = await getDoc(adminRef);

    if (!adminSnap.exists()) {

        await signOut(auth);

        throw new Error(
            "Você não possui permissão para acessar o painel."
        );

    }

};

    const logout = async () => {

        await signOut(auth);

    };

    return (

        <AuthContext.Provider
    value={{
        user,
        adminData,
        loading,
        login,
        logout,
    }}
>

            {children}

        </AuthContext.Provider>

    );

};

export const useAuth = () => {

    return useContext(AuthContext);

};