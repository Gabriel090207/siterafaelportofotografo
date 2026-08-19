import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";

import db from "./firestore";
import api from "../api/client";

import type { AlbumClient } from "../../types/albumClient";

export interface ResolvedAlbumClient {
    albumId: string;
    canonicalSlug: string;
    resolvedBy: "slug" | "legacyId";
    isCanonical: boolean;
}

export const createAlbumDocument = async (name: string) => {
    const response = await api.post<{
        albumId: string;
        slug: string;
    }>(
        "/album-client",
        { name },
    );

    return response.data;

};

export const updateAlbumDetails = async (
    albumId: string,
    album: AlbumClient,
) => {
    const albumDetails: Partial<AlbumClient> = {
        ...album,
    };

    delete albumDetails.id;
    delete albumDetails.createdAt;
    delete albumDetails.updatedAt;
    delete albumDetails.name;
    delete albumDetails.slug;

    await updateDoc(
        doc(db, "AlbumClient", albumId),
        {
            ...albumDetails,
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
        `/album-client/${encodeURIComponent(albumId)}/identity`,
        { name },
    );

    return response.data;
};

export const resolveAlbumClient = async (
    identifier: string,
): Promise<ResolvedAlbumClient> => {
    const response = await api.get<ResolvedAlbumClient>(
        `/album-client/resolve/${encodeURIComponent(identifier)}`,
    );

    return response.data;
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
    await api.delete(`/album-client/${encodeURIComponent(albumId)}`);

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


export const getAlbum = async (albumId: string) => {

    const snapshot = await getDoc(
        doc(db, "AlbumClient", albumId)
    );

    if (!snapshot.exists()) {

        return null;

    }

    return {

        id: snapshot.id,

        ...snapshot.data(),

    };

};
