import {
    addDoc,
    collection,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
} from "firebase/firestore";

import { doc, getDoc } from "firebase/firestore";

import db from "./firestore";

import type { Client } from "../../types/client";
import { readClientEmails } from "../../utils/clientEmails";

export const createClient = async (
    client: Omit<
        Client,
        "id" | "createdAt" | "updatedAt" | "emails"
    > & { emails?: string[] }
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

            emails: readClientEmails(doc.data()),

        }));

        callback(clients);

    });

};


export const getClient = async (
    clientId: string
) => {

    const snapshot = await getDoc(
        doc(db, "clients", clientId)
    );

    if (!snapshot.exists()) {
        return null;
    }

    const data = snapshot.data();

    return {

        id: snapshot.id,

        name: data.name ?? "",

        email: data.email ?? "",

        emails: readClientEmails(data),

        phone: data.phone ?? "",

    };

};
