import api from "./client";

export interface ImportDriveRequest {
    fileId: string;
    accessToken: string;
}

export const importDriveFile = async (
    data: ImportDriveRequest
) => {

    const response = await api.post(
        "/google/import",
        data
    );

    return response.data;
};



export const copyDriveFile = async ({
    sourcePath,
    destinationPath,
}: {
    sourcePath: string;
    destinationPath: string;
}) => {

    const response = await api.post(
        "/google/copy",
        {
            sourcePath,
            destinationPath,
        }
    );

    return response.data;

};


export const moveDriveFile = async ({
    sourcePath,
    destinationPath,
}: {
    sourcePath: string;
    destinationPath: string;
}) => {

    const response = await api.post(
        "/google/move",
        {
            sourcePath,
            destinationPath,
        }
    );

    return response.data;

};


export const moveDriveFolder = async ({
    sourceFolder,
    destinationFolder,
}: {
    sourceFolder: string;
    destinationFolder: string;
}) => {

    const response = await api.post(
        "/google/move-folder",
        {
            sourceFolder,
            destinationFolder,
        }
    );

    return response.data;

};

export const uploadAlbumFileToDrive = async ({
    file,
    clientName,
    albumName,
    category,
}: {
    file: File;
    clientName: string;
    albumName: string;
    category: string;
}) => {

    const formData = new FormData();

    formData.append(
        "file",
        file
    );

    formData.append(
        "clientName",
        clientName
    );

    formData.append(
        "albumName",
        albumName
    );

    formData.append(
        "category",
        category
    );

    const response = await api.post(
        "/google/upload-album-file",
        formData,
    );

    return response.data;

};


export const uploadFeedFileToDrive = async ({
    file,
    albumCategory,
    albumName,
    folder,
}: {
    file: File;
    albumCategory: string;
    albumName: string;
    folder: string;
}) => {

    const formData = new FormData();

    formData.append(
        "file",
        file
    );

    formData.append(
        "albumCategory",
        albumCategory
    );

    formData.append(
        "albumName",
        albumName
    );

    formData.append(
        "folder",
        folder
    );

    const response = await api.post(
        "/google/upload-feed-file",
        formData,
    );

    return response.data;

};



export const copyPickerFileToDrive = async ({
    fileId,
    accessToken,
    albumCategory,
    albumName,
    folder,
}: {
    fileId: string;
    accessToken: string;
    albumCategory: string;
    albumName: string;
    folder: string;
}) => {

    const { data } = await api.post(
        "/google/copy-picker-file",
        {
            fileId,
            accessToken,
            albumCategory,
            albumName,
            folder,
        }
    );

    return data;
};



export const copyPickerAlbumFileToDrive = async ({
    fileId,
    accessToken,
    clientName,
    albumName,
    category,
}: {
    fileId: string;
    accessToken: string;
    clientName: string;
    albumName: string;
    category: string;
}) => {

    const { data } = await api.post(
        "/google/copy-picker-album-file",
        {
            fileId,
            accessToken,
            clientName,
            albumName,
            category,
        }
    );

    return data;
};


export const renameDriveFolder = async ({
    folderId,
    newName,
}: {
    folderId: string;
    newName: string;
}) => {

    const response = await api.post(
        "/google/rename-folder",
        {
            folderId,
            newName,
        }
    );

    return response.data;

};



export const deleteDriveFile = async ({
    fileId,
}: {
    fileId: string;
}) => {

    const response = await api.post(
        "/google/delete-file",
        {
            fileId,
        }
    );

    return response.data;

};



export const moveStorageFolder = async ({
    sourceFolder,
    destinationFolder,
}: {
    sourceFolder: string;
    destinationFolder: string;
}) => {

    const response = await api.post(
        "/google/storage/move-folder",
        {
            sourceFolder,
            destinationFolder,
        }
    );

    return response.data;

};


export const deleteDriveFolder = async ({
    folderId,
}: {
    folderId: string;
}) => {

    const response = await api.post(
        "/google/delete-folder",
        {
            folderId,
        }
    );

    return response.data;

}; 