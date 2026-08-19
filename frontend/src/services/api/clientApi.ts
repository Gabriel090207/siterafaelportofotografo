import auth from "../firebase/auth";

export const CLIENT_SESSION_INVALID_EVENT = "client-session-invalid";

export class ClientApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "ClientApiError";
        this.status = status;
    }
}

const notifyInvalidSession = () => {
    window.dispatchEvent(new Event(CLIENT_SESSION_INVALID_EVENT));
};

const getAuthorization = async () => {
    await auth.authStateReady();

    const user = auth.currentUser;

    if (!user) {
        notifyInvalidSession();
        throw new ClientApiError("Usuário não autenticado.", 401);
    }

    try {
        return `Bearer ${await user.getIdToken()}`;
    } catch {
        notifyInvalidSession();
        throw new ClientApiError("Não foi possível validar a sessão.", 401);
    }
};

const getErrorDetail = async (response: Response) => {
    try {
        const body: unknown = await response.clone().json();

        if (
            typeof body === "object"
            && body !== null
            && "detail" in body
            && typeof body.detail === "string"
        ) {
            return body.detail;
        }
    } catch {
        // A resposta pode não possuir JSON.
    }

    return "A solicitação não pôde ser concluída.";
};

export const clientApiFetch = async (
    path: string,
    options: RequestInit = {}
) => {
    const authorization = await getAuthorization();
    const response = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: authorization,
        },
    });

    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            notifyInvalidSession();
        }

        throw new ClientApiError(
            await getErrorDetail(response),
            response.status
        );
    }

    return response;
};

export const clientApiJson = async <T>(
    path: string,
    options: RequestInit = {}
) => {
    const response = await clientApiFetch(path, options);
    return response.json() as Promise<T>;
};
