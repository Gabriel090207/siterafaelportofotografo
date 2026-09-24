import type { ProvisionClientRequest } from "../../services/api/clients";

export const MAX_CLIENT_EMAILS = 10;

export interface ClientFormValues {
    name: string;
    phone: string;
    emails: string[];
    password: string;
    confirmPassword: string;
    active: boolean;
}

export const prepareClientRequest = (values: ClientFormValues): ProvisionClientRequest => {
    const emails = values.emails.map((email) => email.trim()).filter(Boolean);
    if (emails.length > MAX_CLIENT_EMAILS) throw new Error("Informe no máximo 10 e-mails.");
    const seen = new Set<string>();
    for (const email of emails) {
        // Friendly syntax check only; backend validation/Unicode normalization is authoritative.
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) {
            throw new Error("Confira o formato dos e-mails informados.");
        }
        const key = email.toLowerCase();
        if (seen.has(key)) throw new Error("Remova os e-mails duplicados.");
        seen.add(key);
    }
    if (values.password !== values.confirmPassword) throw new Error("As senhas não coincidem.");
    if (values.password !== "" && emails.length === 0) {
        throw new Error("Informe pelo menos um e-mail para definir uma senha.");
    }
    return {
        name: values.name.trim(), phone: values.phone.trim(), emails,
        ...(values.password !== "" ? { password: values.password } : {}),
        active: values.active,
    };
};

export const clientCreationErrorMessage = (error: unknown): string => {
    const response = (error as { response?: { status?: number; data?: { code?: string } } })?.response;
    if (response?.data?.code === "provisioning_reconciliation_required"
        || !response || (response.status ?? 0) >= 500) {
        return "Não foi possível confirmar a criação. Verifique a listagem e solicite verificação operacional antes de tentar novamente, para evitar duplicidade.";
    }
    if (response.status === 409) return "Um dos e-mails já pertence a outro Cliente.";
    if (response.status === 422) return "O backend rejeitou os dados. Revise os e-mails e a combinação de senha antes de confirmar novamente.";
    if (response.status === 401 || response.status === 403) return "Sua sessão não permite criar Clientes. Verifique seu acesso administrativo.";
    return "Não foi possível criar o Cliente. Verifique os dados e tente novamente.";
};
