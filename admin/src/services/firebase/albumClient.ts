import {
    addDoc,
    collection,
    doc,
    getDoc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    deleteDoc,
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


export const deleteAlbum = async (
    albumId: string,
) => {

    await deleteDoc(
        doc(
            db,
            "AlbumClient",
            albumId,
        )
    );

};





export const getAlbumById = async (
    albumId: string,
) => {

    const snapshot = await getDoc(

        doc(
            db,
            "AlbumClient",
            albumId,
        )

    );

    if (!snapshot.exists()) {

        return null;

    }

    return {

        id: snapshot.id,

        ...(snapshot.data() as Omit<
            AlbumClient,
            "id"
        >),

    } as AlbumClient;

};