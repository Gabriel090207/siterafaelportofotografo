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

export interface CategoryBannerUploadResult extends UploadResult {
    id: string;
}

const CATEGORY_BANNER_MAX_FILE_SIZE = 10 * 1024 * 1024;

const CATEGORY_BANNER_EXTENSIONS: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
};

export const validateCategoryBannerImageFile = (file: File) => {
    if (!CATEGORY_BANNER_EXTENSIONS[file.type]) {
        throw new Error(
            "Formato inválido. Selecione uma imagem JPEG, PNG ou WebP."
        );
    }

    if (file.size > CATEGORY_BANNER_MAX_FILE_SIZE) {
        throw new Error("A imagem deve ter no máximo 10 MB.");
    }
};

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
 * Upload dos arquivos exibidos no site público de eventos.
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


const url =
    await getDownloadURL(
        newRef
    );



return {
    storagePath: newPath,
    url,
};

};

export const uploadEventCategoryCover = async (
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

export const uploadCategoryBannerImage = async (
    categoryId: string,
    file: File,
): Promise<CategoryBannerUploadResult> => {
    const normalizedCategoryId = categoryId.trim();

    if (!normalizedCategoryId) {
        throw new Error("A categoria do banner é obrigatória.");
    }

    validateCategoryBannerImageFile(file);

    const imageId = crypto.randomUUID();
    const originalExtension = file.name.split(".").pop()?.toLowerCase();
    const acceptedExtensions = file.type === "image/jpeg"
        ? ["jpg", "jpeg"]
        : [CATEGORY_BANNER_EXTENSIONS[file.type]];
    const extension = originalExtension
        && acceptedExtensions.includes(originalExtension)
        ? originalExtension
        : CATEGORY_BANNER_EXTENSIONS[file.type];
    const fullPath =
        `Eventos/${normalizedCategoryId}/Banner/${imageId}.${extension}`;
    const upload = await uploadFile(fullPath, file);

    return {
        id: imageId,
        ...upload,
    };
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



export const uploadSiteHeroBackground = async (
    file: File,
): Promise<UploadResult> => {

    const fullPath =
        `Site/Hero/background.${file.name.split(".").pop()}`;

    return uploadFile(
        fullPath,
        file
    );

};



export const uploadSiteExperienceImage = async (
    index: number,
    file: File,
): Promise<UploadResult> => {

    const extension =
        file.name.split(".").pop();

    const fullPath =
        `Site/Experiences/Card-${index}.${extension}`;

    return uploadFile(
        fullPath,
        file
    );

};


export const uploadSitePortfolioImage = async (
    index: number,
    file: File,
): Promise<UploadResult> => {

    const extension =
        file.name.split(".").pop();

    const fullPath =
        `Site/Portfolio/Card-${index}.${extension}`;

    return uploadFile(
        fullPath,
        file
    );

};

export const uploadSiteFilmsThumbnail = async (
    file: File,
): Promise<UploadResult> => {

    const extension =
        file.name.split(".").pop();

    const fullPath =
        `Site/Films/Thumbnail.${extension}`;

    return uploadFile(
        fullPath,
        file
    );

};

export const uploadSiteFilmVideo = async (
    file: File,
): Promise<UploadResult> => {

    const extension =
        file.name.split(".").pop();

    const fullPath =
        `Site/Films/Video.${extension}`;

    return uploadFile(
        fullPath,
        file
    );

};

export const uploadSiteAboutBackground = async (
    file: File,
): Promise<UploadResult> => {

    const extension =
        file.name.split(".").pop();

    const fullPath =
        `Site/About/Background.${extension}`;

    return uploadFile(
        fullPath,
        file
    );

};


export const uploadTestimonialPhoto = async (
    file: File,
): Promise<UploadResult> => {

    const extension =
        file.name
            .split(".")
            .pop()
            ?.toLowerCase() ?? "jpg";


    const uniqueName =
        `${Date.now()}-${crypto.randomUUID()}.${extension}`;


    const fullPath =
        `Depoimentos/Fotos/${uniqueName}`;


    return uploadFile(
        fullPath,
        file
    );

};
