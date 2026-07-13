export type AlbumClientStatus =
    | "published"
    | "draft"
    | "hidden";

export type AlbumClientFileSource =
    | "computer"
    | "drive";

export interface AlbumClientPhoto {
    id: string;

    name: string;

    preview: string;

    size: number;

    file?: File;

    driveId?: string;

    storagePath?: string;

    source: AlbumClientFileSource;
}

export interface AlbumClientVideo {
    id: string;

    name: string;

    preview?: string;

    size: number;

    file?: File;

    driveId?: string;

    storagePath?: string;

    source: AlbumClientFileSource;
}

export interface AlbumClient {
    id?: string;

    clientId: string;

    clientName: string;

    name: string;

    description: string;

    eventDate?: string;

    eventTime?: string;

    eventLocation?: string;

    status: AlbumClientStatus;

    coverPhoto?: AlbumClientPhoto;

    watermarkedPhotos: AlbumClientPhoto[];

    highQualityPhotos: AlbumClientPhoto[];

    watermarkedVideos: AlbumClientVideo[];

    highQualityVideos: AlbumClientVideo[];

    highQualityDownloadDays: number | null;

    createdAt?: Date;

    updatedAt?: Date;
}