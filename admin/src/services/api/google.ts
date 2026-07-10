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