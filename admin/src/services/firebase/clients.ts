import {
    addDoc,
    collection,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
} from "firebase/firestore";


import db from "./firestore";

import type { Client } from "../../types/client";

export const createClient = async (
    client: Omit<
        Client,
        "id" | "createdAt" | "updatedAt"
    >
) => {

    await addDoc(
        collection(db, "clients"),
        {
            ...client,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        }
    );

};

export const subscribeClients = (
    callback: (clients: Client[]) => void
) => {

    const q = query(
        collection(db, "clients"),
        orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {

        const clients: Client[] = snapshot.docs.map((doc) => ({

            id: doc.id,

            ...(doc.data() as Omit<Client, "id">),

        }));

        callback(clients);

    });

};