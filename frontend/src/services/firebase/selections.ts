import {
    addDoc,
    collection,
    doc,
    serverTimestamp,
    updateDoc,
    deleteDoc,
    getDoc,
    onSnapshot,
    orderBy,
    query,
} from "firebase/firestore";

import db from "./firestore";

import type { Selection } from "../../types/selection";

export const createSelection = async (
    selection: Omit<
        Selection,
        "id" | "createdAt" | "updatedAt"
    >
) => {

    const selectionRef = collection(
        db,
        "clients",
        selection.clientId,
        "selections"
    );

    const docRef = await addDoc(
        selectionRef,
        {
            ...selection,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        }
    );

    return docRef.id;

};