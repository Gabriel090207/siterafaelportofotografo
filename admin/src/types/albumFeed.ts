export type AlbumStatus =
    | "published"
    | "draft"
    | "hidden";

export type AlbumPhotoSource =
    | "computer"
    | "drive";

export interface AlbumPhoto {

    id: string;

    name: string;

    preview: string;

    size: number;

    file?: File;

    driveId?: string;

    driveFileId?: string;

    storagePath?: string;

    source: AlbumPhotoSource;

}

export interface AlbumVideo {

    id: string;

    name: string;

    preview?: string;

    size: number;

    file?: File;

    driveId?: string;

    driveFileId?: string;

    storagePath?: string;

    source: AlbumPhotoSource;

}

export interface AlbumCategory {

    id: string;

    name: string;

    photos: AlbumPhoto[];

}

export interface Album {

    id?: string;

    driveFolderId?: string;

    name: string;

    description: string;

    category: string;

    eventDate?: string;

    eventTime?: string;

    eventLocation?: string;

    status: AlbumStatus;

    hasVideo: boolean;

    coverPhoto?: AlbumPhoto;

    photos: AlbumPhoto[];

    videos: AlbumVideo[];

    categories: AlbumCategory[];

    createdAt?: Date;

    updatedAt?: Date;

}

