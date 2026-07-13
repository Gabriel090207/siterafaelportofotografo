import {
    getDownloadURL,
    ref,
    uploadBytes,
} from "firebase/storage";

import storage from "./storage";

export interface UploadResult {
    url: string;

    storagePath: string;
}

const uploadFile = async (
    fullPath: string,
    file: File,
): Promise<UploadResult> => {

    const storageRef = ref(
        storage,
        fullPath
    );

    await uploadBytes(
        storageRef,
        file
    );

    const url = await getDownloadURL(
        storageRef
    );

    return {
        url,
        storagePath: fullPath,
    };

};

/**
 * Upload dos arquivos exibidos no Feed público.
 */
export const uploadAlbumFile = async (
    albumFolder: string,
    storagePath: string,
    file: File,
): Promise<UploadResult> => {

    const fullPath =
        `AlbumFeed/${albumFolder}/${storagePath}`;

    return uploadFile(
        fullPath,
        file
    );

};

/**
 * Upload dos arquivos privados do álbum do cliente.
 */
export const uploadAlbumClientFile = async (
    albumFolder: string,
    storagePath: string,
    file: File,
): Promise<UploadResult> => {

    const fullPath =
    `AlbumClient/${albumFolder}/${storagePath}`;

    return uploadFile(
        fullPath,
        file
    );

};