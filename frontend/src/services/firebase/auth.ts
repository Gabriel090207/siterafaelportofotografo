import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
} from "firebase/auth";

import app from "./firebase";

const auth = getAuth(app);

export const loginClient = async (
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

export const logoutClient = async () => {

    await signOut(auth);

};

export default auth;