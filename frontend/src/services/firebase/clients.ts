import {
    collection,
    getDocs,
    query,
    where,
} from "firebase/firestore";

import db from "./firestore";

export const getClientByUid = async (
    uid: string
) => {

    const q = query(
        collection(db, "clients"),
        where("uid", "==", uid)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {

        return null;

    }

    const doc = snapshot.docs[0];

    return {

        id: doc.id,

        ...doc.data(),

    };

};