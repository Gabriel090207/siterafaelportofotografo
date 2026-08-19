import { clientApiFetch, clientApiJson } from "./clientApi";

export interface ClientAlbumSummary {
    id: string;
    slug: string;
    name: string;
    eventDate: string | null;
    eventLocation: string | null;
    coverPhoto: { preview: string } | null;
    photoCount: number;
    videoCount: number;
    createdAt: string | null;
    highQualityDownloadDays: unknown;
}

export interface ClientAlbumMedia {
    id: string;
    name: string;
    preview: string;
}

export interface ClientAlbumDetails {
    id: string;
    slug: string;
    name: string;
    eventDate: string | null;
    eventLocation: string | null;
    watermarkedPhotos: ClientAlbumMedia[];
    watermarkedVideos: ClientAlbumMedia[];
}

interface ClientAlbumsResponse {
    albums: ClientAlbumSummary[];
}

interface ClientAlbumResponse {
    album: ClientAlbumDetails;
}

export interface ResolvedClientAlbum {
    albumId: string;
    canonicalSlug: string;
    resolvedBy: "slug" | "legacyId";
    isCanonical: boolean;
    album: ClientAlbumDetails;
}

interface CreateSelectionData {
    selectionName: string;
    personName: string;
    email: string;
    photoIds: string[];
}

interface CreateSelectionResponse {
    id: string;
    totalPhotos: number;
}

export const getClientAlbums = async (signal?: AbortSignal) => {
    const response = await clientApiJson<ClientAlbumsResponse>(
        "/client/albums",
        { signal }
    );

    return response.albums;
};

export const getClientAlbum = async (
    albumId: string,
    signal?: AbortSignal
) => {
    const response = await clientApiJson<ClientAlbumResponse>(
        `/client/albums/${encodeURIComponent(albumId)}`,
        { signal }
    );

    return response.album;
};

export const resolveClientAlbum = (
    identifier: string,
    signal?: AbortSignal
) =>
    clientApiJson<ResolvedClientAlbum>(
        `/client/albums/resolve/${encodeURIComponent(identifier)}`,
        { signal }
    );

export const createClientAlbumSelection = (
    albumId: string,
    data: CreateSelectionData
) =>
    clientApiJson<CreateSelectionResponse>(
        `/client/albums/${encodeURIComponent(albumId)}/selections`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        }
    );

export const downloadClientAlbum = (
    albumId: string
) =>
    clientApiFetch("/album/download", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ albumId }),
    });
