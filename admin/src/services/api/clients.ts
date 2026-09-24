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
