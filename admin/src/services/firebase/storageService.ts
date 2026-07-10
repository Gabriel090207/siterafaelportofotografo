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

export const uploadAlbumFile = async (

    albumId: string,

    storagePath: string,

    file: File,

): Promise<UploadResult> => {

    const fullPath =

        `albums/${albumId}/${storagePath}`;

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