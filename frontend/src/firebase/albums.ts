import {
    collection,
    onSnapshot,
    orderBy,
    query,
    where,
    doc,
} from "firebase/firestore";

import db from "./firestore";

export const subscribeAlbums = (
    callback: (albums: any[]) => void
) => {

    const q = query(
        collection(db, "AlbumClient"),
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


export const subscribeClientAlbums = (
    clientId: string,
    callback: (albums: any[]) => void
) => {

    const q = query(
        collection(db, "AlbumClient"),
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


export const subscribeAlbum = (
    albumId: string,
    callback: (album: any | null) => void
) => {

    return onSnapshot(

        doc(db, "AlbumClient", albumId),

        (snapshot) => {

            if (!snapshot.exists()) {

                callback(null);

                return;

            }

            callback({

                id: snapshot.id,

                ...snapshot.data(),

            });

        }

    );

};