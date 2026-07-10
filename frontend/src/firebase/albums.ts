import {
    collection,
    onSnapshot,
    orderBy,
    query,
} from "firebase/firestore";

import db from "./firestore";

export const subscribeAlbums = (
    callback: (albums: any[]) => void
) => {

    const q = query(
        collection(db, "albums"),
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

import {
    where,
} from "firebase/firestore";

export const subscribeClientAlbums = (
    clientId: string,
    callback: (albums: any[]) => void
) => {

    const q = query(
        collection(db, "albums"),
        where("clientId", "==", clientId)
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