import {
    getAuth,
    signInWithEmailAndPassword,
    signInWithCustomToken,
    signOut,
} from "firebase/auth";

import app from "./firebase";
import { requestClientLoginToken } from "../api/clientLogin";

const auth = getAuth(app);

// Retained for the transition; the login page never falls back to this function.
export const loginLegacyClient = async (
    email: string,
    password: string
) => {

    const result = await signInWithEmailAndPassword(
        auth,
        email,
        password
    );

    return result.user;

};

export const loginClient = async (email: string, password: string) => {
    const token = await requestClientLoginToken(email, password);
    return loginClientWithCustomToken(token);
};

export const loginClientWithCustomToken = async (token: string) => {
    const result = await signInWithCustomToken(auth, token);
    return result.user;
};

export const logoutClient = async () => {

    await signOut(auth);

};

export default auth;
