import auth from "../firebase/auth";

export type ClientTestimonialStatus = "active" | "hidden";

export interface ClientTestimonial {
    id: string;
    name: string;
    email: string;
    message: string;
    photoUrl: string;
    photoStoragePath: string;
    status: ClientTestimonialStatus;
    createdAt: string | null;
    updatedAt: string | null;
}

interface ClientTestimonialsResponse {
    testimonials: ClientTestimonial[];
}

interface UpdateClientTestimonialData {
    name: string;
    message: string;
}

export class ClientTestimonialsApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "ClientTestimonialsApiError";
        this.status = status;
    }
}

const apiUrl = import.meta.env.VITE_API_URL;

const getAuthorizationHeader = async () => {
    await auth.authStateReady();

    const user = auth.currentUser;

    if (!user) {
        throw new ClientTestimonialsApiError(
            "Usuário não autenticado.",
            401
        );
    }

    const idToken = await user.getIdToken();

    return `Bearer ${idToken}`;
};

const request = async <T>(
    path: string,
    options: RequestInit = {}
): Promise<T> => {
    let authorization: string;

    try {
        authorization = await getAuthorizationHeader();
    } catch (error) {
        if (error instanceof ClientTestimonialsApiError) {
            throw error;
        }

        throw new ClientTestimonialsApiError(
            "Não foi possível validar a sessão.",
            401
        );
    }

    const response = await fetch(`${apiUrl}${path}`, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: authorization,
        },
    });

    if (!response.ok) {
        throw new ClientTestimonialsApiError(
            "A solicitação não pôde ser concluída.",
            response.status
        );
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
};

export const getClientTestimonials = async () => {
    const response = await request<ClientTestimonialsResponse>(
        "/client/testimonials"
    );

    return response.testimonials;
};

export const updateClientTestimonial = (
    testimonialId: string,
    data: UpdateClientTestimonialData
) =>
    request<ClientTestimonial>(
        `/client/testimonials/${encodeURIComponent(testimonialId)}`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        }
    );

export const deleteClientTestimonial = (
    testimonialId: string
) =>
    request<void>(
        `/client/testimonials/${encodeURIComponent(testimonialId)}`,
        {
            method: "DELETE",
        }
    );
