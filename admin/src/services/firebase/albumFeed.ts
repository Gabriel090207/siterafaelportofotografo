import {
    addDoc,
    collection,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from "firebase/firestore";

import db from "./firestore";

import type { Album } from "../../types/albumFeed";

export const createAlbumDocument = async () => {

    const docRef = await addDoc(
        collection(db, "AlbumFeed"),
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
        doc(db, "AlbumFeed", albumId),
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
        collection(db, "AlbumFeed"),
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


export const subscribeAlbumsByCategory = (
    category: string,
    callback: (albums: Album[]) => void
) => {

    const q = query(
        collection(db, "AlbumFeed"),
        where("category", "==", category),
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