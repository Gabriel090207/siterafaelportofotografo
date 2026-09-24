export const requestClientLoginToken = async (
    email: string,
    password: string,
): Promise<string> => {
    let response: Response;
    try {
        response = await fetch(`${import.meta.env.VITE_API_URL}/client/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({ email, password }),
        });
    } catch {
        throw Object.assign(new Error("Não foi possível conectar."), {
            code: "auth/network-request-failed",
        });
    }
    if (!response.ok) {
        // Never propagate a backend response body or submitted credentials in errors.
        throw Object.assign(new Error("Não foi possível entrar."), {
            code: response.status === 401 ? "auth/invalid-credential"
                : response.status === 429 ? "auth/too-many-requests"
                : "auth/login-unavailable",
        });
    }
    const data: unknown = await response.json();
    if (typeof data !== "object" || data === null || !("customToken" in data)
        || typeof data.customToken !== "string" || !data.customToken) {
        throw new Error("Resposta de login inválida.");
    }
    return data.customToken;
};
