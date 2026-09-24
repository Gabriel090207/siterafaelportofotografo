import api from "./client";

export interface ProvisionClientRequest {
    name: string;
    phone: string;
    emails: string[];
    password?: string;
    active: boolean;
}

export interface ProvisionClientResponse {
    clientId: string;
    uid: string;
    name: string;
    phone: string;
    emails: string[];
    email: string;
    active: boolean;
    role: "client";
    albumsCount: number;
    hasPassword: boolean;
}

export const provisionClient = async (data: ProvisionClientRequest) => {
    // Explicit allowlist: UI-only confirmation and identity fields never leave here.
    const response = await api.post<ProvisionClientResponse>("/admin/clients", {
        name: data.name,
        phone: data.phone,
        emails: data.emails,
        ...(data.password !== undefined ? { password: data.password } : {}),
        active: data.active,
    });
    return response.data;
};

export const getClientShareLink = async (clientId: string): Promise<string> => {
    try {
        const response = await api.post<{ shareLink: string }>(`/admin/clients/${encodeURIComponent(clientId)}/link`);
        if (typeof response.data.shareLink !== "string" || !response.data.shareLink) throw new Error();
        return response.data.shareLink;
    } catch (error) {
        // Do not propagate Axios response/config objects that may contain the link.
        const status = (error as { response?: { status?: number } })?.response?.status;
        throw new Error(status === 409
            ? "O link de acesso deste cliente foi revogado."
            : "Não foi possível obter o link de acesso. Tente novamente.");
    }
};

export const deleteClient = async (clientId: string): Promise<void> => {
    try {
        await api.delete(
            `/admin/clients/${encodeURIComponent(clientId)}`
        );
    } catch (error) {
        const status = (
            error as { response?: { status?: number } }
        )?.response?.status;

        if (status === 404) {
            throw new Error("Cliente não encontrado.");
        }

        if (status === 409) {
            throw new Error(
                "Os dados deste cliente estão inconsistentes e a exclusão não foi realizada."
            );
        }

        if (status === 503) {
            throw new Error(
                "Não foi possível concluir a exclusão do cliente. Tente novamente ou verifique o servidor."
            );
        }

        throw new Error(
            "Não foi possível excluir o cliente. Tente novamente."
        );
    }
};


export interface RevealClientPasswordResponse {
    hasPassword: boolean;
    password: string;
}

export const revealClientPassword = async (
    clientId: string
): Promise<RevealClientPasswordResponse> => {
    try {
        const response =
            await api.get<RevealClientPasswordResponse>(
                `/admin/clients/${encodeURIComponent(clientId)}/password`
            );

        return response.data;

    } catch (error) {
        const status = (
            error as {
                response?: {
                    status?: number;
                    data?: {
                        detail?: string;
                        hasPassword?: boolean;
                    };
                };
            }
        )?.response?.status;

        if (status === 404) {
            throw new Error("Este cliente não possui senha cadastrada.");
        }

        if (status === 503) {
            throw new Error(
                "Não foi possível revelar a senha do cliente."
            );
        }

        throw new Error(
            "Não foi possível obter a senha do cliente."
        );
    }
};

export interface UpdateClientRequest {
    name: string;
    phone: string;
    emails: string[];
    password?: string;
    active: boolean;
}

export interface UpdateClientResponse {
    clientId: string;
    name: string;
    phone: string;
    emails: string[];
    active: boolean;
    passwordChanged: boolean;
}

export const updateClient = async (
    clientId: string,
    data: UpdateClientRequest
): Promise<UpdateClientResponse> => {
    try {
        const response = await api.patch<UpdateClientResponse>(
            `/admin/clients/${encodeURIComponent(clientId)}`,
            data
        );

        return response.data;
    } catch (error) {
        const detail = (
            error as {
                response?: {
                    data?: {
                        detail?: string;
                    };
                };
            }
        )?.response?.data?.detail;

        throw new Error(
            detail || "Não foi possível atualizar o cliente."
        );
    }
};