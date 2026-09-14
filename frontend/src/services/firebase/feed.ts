import {
    collection,
    onSnapshot,
    orderBy,
    query,
    where,
} from "firebase/firestore";

import db from "./firestore";

// Keep the category ordering rule identical in admin and public feed services.
interface CategoryOrderedAlbum {
    id?: string;
    order?: unknown;
    createdAt?: unknown;
}

const albumCreatedTime = (value: unknown): number => {
    if (value instanceof Date) {
        return Number.isFinite(value.getTime()) ? value.getTime() : 0;
    }
    if (value && typeof value === "object" && "seconds" in value) {
        const { seconds } = value;
        const nanos = "nanoseconds" in value ? value.nanoseconds : 0;
        if (typeof seconds === "number" && Number.isSafeInteger(seconds)
            && typeof nanos === "number" && Number.isSafeInteger(nanos)
            && nanos >= 0 && nanos < 1e9) {
            const milliseconds = seconds * 1000 + nanos / 1e6;
            return Number.isFinite(milliseconds) && Math.abs(milliseconds) <= 8.64e15
                ? milliseconds : 0;
        }
    }
    return 0;
};

export const sortCategoryAlbums = <T extends CategoryOrderedAlbum>(albums: readonly T[]): T[] => {
    const validOrder = (value: unknown): value is number =>
        typeof value === "number" && Number.isSafeInteger(value) && value > 0;

    return [...albums].sort((a, b) => {
        const aOrdered = validOrder(a.order);
        const bOrdered = validOrder(b.order);
        if (aOrdered !== bOrdered) return aOrdered ? 1 : -1;
        if (validOrder(a.order) && validOrder(b.order) && a.order !== b.order) {
            return a.order - b.order;
        }
        const dateDifference = albumCreatedTime(b.createdAt) - albumCreatedTime(a.createdAt);
        if (dateDifference) return dateDifference;
        const aId = a.id ?? "";
        const bId = b.id ?? "";
        return aId < bId ? -1 : aId > bId ? 1 : 0;
    });
};

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
    callback: (albums: any[]) => void,
    onError?: (error: Error) => void,
) => {

    const q = query(
        collection(db, "AlbumFeed"),
        where("category", "==", category)
    );

    return onSnapshot(q, (snapshot) => {

        const albums = snapshot.docs.map((doc) => ({

            ...doc.data(),

            id: doc.id,

        }));

        callback(sortCategoryAlbums(albums));

    }, onError);

};
