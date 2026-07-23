import {
    getDownloadURL,
    ref,
    uploadBytes,
    deleteObject,
    listAll,
    getBlob,
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
    category: string,
    albumFolder: string,
    storagePath: string,
    file: File,
): Promise<UploadResult> => {


    const safeCategory =
        category
            .trim()
            .replace(/[\\/:*?"<>|]/g, "-");


    const fullPath =
        `AlbumFeed/${safeCategory}/${albumFolder}/${storagePath}`;


    return uploadFile(
        fullPath,
        file
    );

};


export const uploadFeedCover = async (
    category: string,
    albumFolder: string,
    file: File,
): Promise<UploadResult> => {


    const safeCategory =
        category
            .trim()
            .replace(/[\\/:*?"<>|]/g, "-");


    const fullPath =
        `AlbumFeed/${safeCategory}/${albumFolder}/Capa/${file.name}`;


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





export const deleteFolder = async (
    folderPath: string,
) => {

    const folderRef = ref(
        storage,
        folderPath,
    );

    const result = await listAll(folderRef);

    await Promise.all(
        result.items.map((item) =>
            deleteObject(item)
        )
    );

    await Promise.all(
        result.prefixes.map((folder) =>
            deleteFolder(folder.fullPath)
        )
    );

};


export const deleteFile = async (
    storagePath: string,
) => {

    const fileRef = ref(
        storage,
        storagePath,
    );

    await deleteObject(fileRef);

};


export const moveFile = async (
    oldPath: string,
    newPath: string,
) => {

    const oldRef = ref(
        storage,
        oldPath,
    );

    const newRef = ref(
        storage,
        newPath,
    );

    const blob = await getBlob(
        oldRef,
    );

    await uploadBytes(
        newRef,
        blob,
    );

    await deleteObject(
        oldRef,
    );

};


export const moveStorageFolder = async (
    sourceFolder: string,
    destinationFolder: string,
): Promise<{
    files: {
        oldPath: string;
        newPath: string;
        url: string;
    }[];
}> => {

    const movedFiles: {
        oldPath: string;
        newPath: string;
        url: string;
    }[] = [];


    const sourceRef =
        ref(
            storage,
            sourceFolder
        );


    const result =
        await listAll(
            sourceRef
        );


    await Promise.all(

        result.items.map(
            async (item) => {


                const newPath =
                    item.fullPath.replace(
                        sourceFolder,
                        destinationFolder
                    );


                const copied =
                    await copyStorageFile(
                        item.fullPath,
                        newPath
                    );


                movedFiles.push({

                    oldPath:
                        item.fullPath,

                    newPath,

                    url:
                        copied.url,

                });


                await deleteObject(
                    item
                );


            }
        )

    );


    const folders =
        await Promise.all(

            result.prefixes.map(
                async(folder)=>{


                    return await moveStorageFolder(

                        folder.fullPath,

                        folder.fullPath.replace(
                            sourceFolder,
                            destinationFolder
                        )

                    );


                }

            )

        );


    folders.forEach(folder => {

        if(folder?.files){

            movedFiles.push(
                ...folder.files
            );

        }

    });


    return {
        files: movedFiles,
    };

};

export const copyStorageFile = async (
    oldPath: string,
    newPath: string,
) => {

    const oldRef = ref(
        storage,
        oldPath
    );


    const blob = await getBlob(
        oldRef
    );


    const newRef = ref(
        storage,
        newPath
    );


    await uploadBytes(
    newRef,
    blob
);

console.log(
    "COPIADO:",
    newPath
);

const url =
    await getDownloadURL(
        newRef
    );

console.log(
    "URL NOVA:",
    url
);


return {
    storagePath: newPath,
    url,
};

};

export const uploadFeedCategoryCover = async (
    categoryName: string,
    file: File,
): Promise<UploadResult> => {

    const safeName =
        categoryName
            .trim()
            .replace(/[\\/:*?"<>|]/g, "-");


    const fullPath =
        `Eventos/${safeName}/Capa/${file.name}`;


    return uploadFile(
        fullPath,
        file
    );

};

export const updateStoragePathUrl = async (
    newPath: string,
) => {

    const newRef = ref(
        storage,
        newPath
    );


    const url =
        await getDownloadURL(
            newRef
        );


    return {
        storagePath: newPath,
        url,
    };

};