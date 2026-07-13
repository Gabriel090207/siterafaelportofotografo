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

import type { AlbumClient } from "../../types/albumClient";

export const createAlbumDocument = async () => {

    const docRef = await addDoc(
        collection(db, "AlbumClient"),
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
        AlbumClient,
        "id" | "createdAt" | "updatedAt"
    >
) => {

    await updateDoc(
        doc(db, "AlbumClient", albumId),
        {
            ...album,
            updatedAt: serverTimestamp(),
        }
    );

};

export const subscribeAlbums = (
    callback: (albums: AlbumClient[]) => void
) => {

    const q = query(
        collection(db, "AlbumClient"),
        orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {

        callback(

            snapshot.docs.map((doc) => ({

                id: doc.id,

                ...(doc.data() as Omit<
                    AlbumClient,
                    "id"
                >),

            }))

        );

    });

};