import {
    collection,
    onSnapshot,
    orderBy,
    query,
    where,
} from "firebase/firestore";

import db from "./firestore";

export interface PublicAlbumFeedResponse {
    albumId: string;
    canonicalSlug?: string;
    canonicalCategorySlug: string;
    requestedIdentifier: string;
    resolvedBy: "slug" | "legacyId";
    isCanonical: boolean;
    album: Record<string, unknown> & { id: string; slug?: string };
}

export interface PublicContextualAlbumFeedResponse {
    categoryId: string;
    albumId: string;
    canonicalCategorySlug: string;
    canonicalAlbumSlug: string;
    isCanonical: boolean;
    album: Record<string, unknown> & { id: string; slug?: string };
}

export class PublicAlbumFeedError extends Error {
    status: number;

    constructor(status: number) {
        super("Não foi possível carregar o evento.");
        this.status = status;
    }
}

export const getPublicAlbumFeed = async (
    identifier: string,
): Promise<PublicAlbumFeedResponse> => {
    const response = await fetch(
        `${import.meta.env.VITE_API_URL}/public/album-feed/${encodeURIComponent(identifier)}`
    );

    if (!response.ok) {
        throw new PublicAlbumFeedError(response.status);
    }

    return response.json();
};

export const getPublicAlbumFeedByCategory = async (
    categorySlug: string,
    albumSlug: string,
): Promise<PublicContextualAlbumFeedResponse> => {
    const response = await fetch(
        `${import.meta.env.VITE_API_URL}/public/album-feed/${encodeURIComponent(categorySlug)}/${encodeURIComponent(albumSlug)}`
    );

    if (!response.ok) {
        throw new PublicAlbumFeedError(response.status);
    }

    return response.json();
};

export const subscribeAlbums = (
    callback: (albums: any[]) => void,
    onError?: (error: Error) => void,
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

    }, onError);

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
