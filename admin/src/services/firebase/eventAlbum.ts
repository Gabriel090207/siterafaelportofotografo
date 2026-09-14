import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    deleteField,
    runTransaction,
    writeBatch,
    where,
} from "firebase/firestore";

import db from "./firestore";
import api from "../api/client";

import type { Album } from "../../types/eventAlbum";

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

// Read the current category transactionally so an ordinary edit cannot restore
// a stale order, and only a real category change clears the previous position.
const updateAlbumFields = async (albumId: string, fields: Partial<Album>) => {
    const payload = { ...fields };
    delete payload.order;
    const ref = doc(db, "AlbumFeed", albumId);
    await runTransaction(db, async (transaction) => {
        const current = await transaction.get(ref);
        if (!current.exists()) throw new Error("Evento não encontrado.");
        const previousCategory: unknown = current.data().category;
        const categoryChanged = typeof previousCategory === "string"
            && previousCategory.length > 0
            && typeof payload.category === "string"
            && payload.category !== previousCategory;
        transaction.update(ref, {
            ...payload,
            ...(categoryChanged ? { order: deleteField() } : {}),
            updatedAt: serverTimestamp(),
        });
    });
};

export const updateAlbumOrder = async (categoryId: string, albums: readonly Album[]) => {
    if (!categoryId.trim()) throw new Error("Categoria inválida.");
    if (albums.length > 500) {
        throw new Error("Não é possível salvar esta sequência em um único lote (máximo de 500 eventos).");
    }
    const ids = albums.map((album) => album.id);
    if (ids.some((id) => typeof id !== "string" || !id.trim() || id.includes("/"))
        || new Set(ids).size !== ids.length
        || albums.some((album) => album.category !== categoryId)) {
        throw new Error("A sequência contém eventos inválidos ou de outra categoria.");
    }
    if (albums.length === 0) return;
    const batch = writeBatch(db);
    albums.forEach((album, index) => {
        batch.update(doc(db, "AlbumFeed", album.id!), { order: index + 1 });
    });
    await batch.commit();
};

export interface ResolvedEventAlbum {
    categoryId: string;
    albumId: string;
    canonicalCategorySlug: string;
    canonicalAlbumSlug: string;
    categoryResolvedBy: "slug" | "legacyId";
    albumResolvedBy: "slug" | "legacyId";
    isCanonical: boolean;
}

export const resolveEventAlbum = async (
    categoryIdentifier: string,
    albumIdentifier: string,
): Promise<ResolvedEventAlbum> => {
    const response = await api.get<ResolvedEventAlbum>(
        `/album-feed/resolve/${encodeURIComponent(categoryIdentifier)}/${encodeURIComponent(albumIdentifier)}`,
    );

    return response.data;
};

export const createAlbumDocument = async (name: string) => {

    const response = await api.post<{
        albumId: string;
        slug: string;
    }>(
        "/album-feed",
        { name },
    );

    return response.data;

};

export const updateAlbum = async (
    albumId: string,
    album: Omit<
        Album,
        "id" | "createdAt" | "updatedAt"
    >
) => {

    await updateAlbumFields(albumId, album);

};

export const updateAlbumIdentity = async (
    albumId: string,
    name: string,
) => {

    const response = await api.patch<{
        albumId: string;
        name: string;
        slug: string;
        changed: boolean;
    }>(
        `/album-feed/${albumId}/slug`,
        { name },
    );

    return response.data;

};

export const updateAlbumDetails = async (
    albumId: string,
    album: Album,
) => {

    const albumDetails: Partial<Album> = {
        ...album,
    };

    delete albumDetails.id;
    delete albumDetails.createdAt;
    delete albumDetails.updatedAt;
    delete albumDetails.name;
    delete albumDetails.slug;

    await updateAlbumFields(albumId, albumDetails);

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
    categoryId: string,
    callback: (albums: Album[], confirmed: boolean) => void,
    onError?: (error: Error) => void,
) => {

    const q = query(
        collection(db, "AlbumFeed"),
        where("category", "==", categoryId)
    );

    return onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {

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

        callback(sortCategoryAlbums(albums), !snapshot.metadata.hasPendingWrites);

    }, onError);

};

export const getEventAlbum = async (
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

    await api.delete(
        `/album-feed/${albumId}`
    );

};
