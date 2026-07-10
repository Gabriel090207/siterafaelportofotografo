import type {
    DashboardData,
    DashboardAlbum,
    DashboardClient,
} from "../../types/dashboard";

import {
    collection,
    getDocs,
    query,
    orderBy,
    limit,
} from "firebase/firestore";

import db from "../firebase/firestore";

export const getDashboardData = async (): Promise<DashboardData> => {

    const clientsQuery = query(
        collection(db, "clients"),
        orderBy("createdAt", "desc"),
        limit(5)
    );

    const albumsQuery = query(
        collection(db, "albums"),
        orderBy("createdAt", "desc"),
        limit(5)
    );

    const allClientsPromise = getDocs(
        collection(db, "clients")
    );

    const allAlbumsPromise = getDocs(
        collection(db, "albums")
    );

    const latestClientsPromise = getDocs(
        clientsQuery
    );

    const latestAlbumsPromise = getDocs(
        albumsQuery
    );

    const [
        clientsSnapshot,
        albumsSnapshot,
        latestClientsSnapshot,
        latestAlbumsSnapshot,
    ] = await Promise.all([
        allClientsPromise,
        allAlbumsPromise,
        latestClientsPromise,
        latestAlbumsPromise,
    ]);

    let totalPhotos = 0;

    let totalStorage = 0;

    albumsSnapshot.forEach((doc) => {

        const album = doc.data();

        album.photos?.forEach((photo: any) => {

            totalPhotos++;

            totalStorage += photo.size ?? 0;

        });

        album.categories?.forEach((category: any) => {

            category.photos?.forEach((photo: any) => {

                totalPhotos++;

                totalStorage += photo.size ?? 0;

            });

        });

    });

    const clients: DashboardClient[] =
        latestClientsSnapshot.docs.map((doc) => {

            const data = doc.data();

            return {

                id: doc.id,

                name: data.name,

                email: data.email,

                createdAt:
                    data.createdAt?.toDate?.() ??
                    new Date(),

            };

        });

    const albums: DashboardAlbum[] =
        latestAlbumsSnapshot.docs.map((doc) => {

            const data = doc.data();

            return {

                id: doc.id,

                name: data.name,

                createdAt:
                    data.createdAt?.toDate?.() ??
                    new Date(),

            };

        });

    return {

        stats: {

            clients: clientsSnapshot.size,

            albums: albumsSnapshot.size,

            photos: totalPhotos,

            storage:
                Number(
                    (
                        totalStorage /
                        1024 /
                        1024 /
                        1024
                    ).toFixed(2)
                ),

        },

        clients,

        albums,

    };

};