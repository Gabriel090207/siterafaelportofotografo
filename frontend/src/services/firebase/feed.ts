import {
    collection,
    onSnapshot,
    orderBy,
    query,
    where,
} from "firebase/firestore";

import db from "./firestore";

export const subscribeAlbums = (
    callback: (albums: any[]) => void
) => {

    const q = query(
        collection(db, "AlbumFeed"),
        orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {

        callback(

            snapshot.docs.map((doc) => ({

                id: doc.id,

                ...doc.data(),

            }))

        );

    });

};

export const subscribeAlbumsByCategory = (
    category: string,
    callback: (albums: any[]) => void
) => {

    const q = query(
        collection(db, "AlbumFeed"),
        where("category", "==", category)
    );

    return onSnapshot(q, (snapshot) => {

        const albums = snapshot.docs.map((doc) => ({

            id: doc.id,

            ...doc.data(),

        }));

        albums.sort((a: any, b: any) => {

            const aTime =
                a.createdAt?.seconds ?? 0;

            const bTime =
                b.createdAt?.seconds ?? 0;

            return bTime - aTime;

        });

        callback(albums);

    });

};