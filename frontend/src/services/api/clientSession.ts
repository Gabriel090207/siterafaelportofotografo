export interface ClientSessionProfile {
    id: string;
    uid: string;
    name: string;
    email: string;
}

export class ClientSessionApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "ClientSessionApiError";
        this.status = status;
    }
}

const apiUrl = import.meta.env.VITE_API_URL;

export const getClientSession = async (
    idToken: string,
    signal?: AbortSignal
) => {
    const response = await fetch(`${apiUrl}/client/session`, {
        headers: {
            Authorization: `Bearer ${idToken}`,
        },
        signal,
    });

    if (!response.ok) {
        throw new ClientSessionApiError(
            "Não foi possível validar a sessão do cliente.",
            response.status
        );
    }

    const profile: unknown = await response.json();

    if (
        typeof profile !== "object"
        || profile === null
        || !("id" in profile)
        || typeof profile.id !== "string"
        || !("uid" in profile)
        || typeof profile.uid !== "string"
        || !("name" in profile)
        || typeof profile.name !== "string"
        || !("email" in profile)
        || typeof profile.email !== "string"
    ) {
        throw new ClientSessionApiError(
            "A resposta de validação da sessão é inválida.",
            502
        );
    }

    return profile as ClientSessionProfile;
};
