import {
    addDoc,
    collection,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";

import db from "./firestore";

import type { Album } from "../../types/album";

export const createAlbumDocument = async () => {

    const docRef = await addDoc(
        collection(db, "albums"),
        {
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        }
    );

    return docRef.id;

};

export const updateAlbum = async (
    albumId: string,
    album: Omit<
        Album,
        "id" | "createdAt" | "updatedAt"
    >
) => {

    await updateDoc(
        doc(db, "albums", albumId),
        {
            ...album,
            updatedAt: serverTimestamp(),
        }
    );

};

export const subscribeAlbums = (
    callback: (albums: Album[]) => void
) => {

    const q = query(
        collection(db, "albums"),
        orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {

        callback(

            snapshot.docs.map((doc) => ({

                id: doc.id,

                ...(doc.data() as Omit<
                    Album,
                    "id"
                >),

            }))

        );

    });

};