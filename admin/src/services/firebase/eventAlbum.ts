import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from "firebase/firestore";

import db from "./firestore";
import api from "../api/client";

import type { Album } from "../../types/eventAlbum";

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

    await updateDoc(
        doc(db, "AlbumFeed", albumId),
        {
            ...album,
            updatedAt: serverTimestamp(),
        }
    );

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

    await updateDoc(
        doc(db, "AlbumFeed", albumId),
        {
            ...albumDetails,
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
    categoryId: string,
    callback: (albums: Album[]) => void
) => {

    const q = query(
        collection(db, "AlbumFeed"),
        where("category", "==", categoryId)
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
