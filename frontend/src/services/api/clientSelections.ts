import auth from "../firebase/auth";

export type ClientSelectionStatus = "pending" | "viewed" | "completed";

export interface ClientSelectionSummary {
    id: string;
    albumId: string;
    albumName: string;
    selectionName: string;
    personName: string;
    email: string;
    totalPhotos: number;
    status: ClientSelectionStatus | string;
    createdAt: string | null;
    preview: string | null;
}

export interface ClientSelectionPhoto {
    name: string;
    preview: string;
}

export interface ClientSelectionDetails {
    id: string;
    albumId: string;
    albumName: string;
    selectionName: string;
    personName: string;
    email: string;
    totalPhotos: number;
    status: ClientSelectionStatus | string;
    createdAt: string | null;
    photos: ClientSelectionPhoto[];
}

interface ClientSelectionsResponse {
    selections: ClientSelectionSummary[];
}

interface ClientSelectionResponse {
    selection: ClientSelectionDetails;
}

export class ClientSelectionsApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "ClientSelectionsApiError";
        this.status = status;
    }
}

const apiUrl = import.meta.env.VITE_API_URL;

const getAuthorizationHeader = async () => {
    await auth.authStateReady();

    const user = auth.currentUser;

    if (!user) {
        throw new ClientSelectionsApiError(
            "Usuário não autenticado.",
            401
        );
    }

    const idToken = await user.getIdToken();

    return `Bearer ${idToken}`;
};

const request = async <T>(path: string): Promise<T> => {
    let authorization: string;

    try {
        authorization = await getAuthorizationHeader();
    } catch (error) {
        if (error instanceof ClientSelectionsApiError) {
            throw error;
        }

        throw new ClientSelectionsApiError(
            "Não foi possível validar a sessão.",
            401
        );
    }

    const response = await fetch(`${apiUrl}${path}`, {
        headers: {
            Authorization: authorization,
        },
    });

    if (!response.ok) {
        throw new ClientSelectionsApiError(
            "A solicitação não pôde ser concluída.",
            response.status
        );
    }

    return response.json() as Promise<T>;
};

export const getClientSelections = async () => {
    const response = await request<ClientSelectionsResponse>(
        "/client/selections"
    );

    return response.selections;
};

export const getClientSelection = async (selectionId: string) => {
    const response = await request<ClientSelectionResponse>(
        `/client/selections/${encodeURIComponent(selectionId)}`
    );

    return response.selection;
};
