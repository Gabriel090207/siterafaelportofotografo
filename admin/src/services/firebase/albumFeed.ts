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
    where,
     deleteDoc,
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

    ...(doc.data() as Omit<
        Album,
        "id"
    >),

    id: doc.id,

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
        where("category", "==", category)
    );

    return onSnapshot(q, (snapshot) => {

        const albums = snapshot.docs.map((doc) => {

    const data =
        doc.data() as Omit<
            Album,
            "id"
        >;


    return {

        ...data,

        id: doc.id,

    };

});

        albums.sort((a, b) => {

            const aTime =
                (a.createdAt as any)?.seconds ?? 0;

            const bTime =
                (b.createdAt as any)?.seconds ?? 0;

            return bTime - aTime;

        });

        callback(albums);

    });

};

export const getFeedAlbum = async (
    albumId: string
): Promise<Album | null> => {

    const ref = doc(
        db,
        "AlbumFeed",
        albumId
    );


    const snapshot = await getDoc(ref);


    if (!snapshot.exists()) {

        return null;

    }


   return {

    ...(snapshot.data() as Omit<
        Album,
        "id"
    >),

    id: snapshot.id,

};

};


export const deleteAlbum = async (
    albumId: string
) => {

    await deleteDoc(
        doc(
            db,
            "AlbumFeed",
            albumId
        )
    );

};