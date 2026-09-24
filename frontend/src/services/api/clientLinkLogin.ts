export const LINK_LOGIN_ERROR = "Link inválido ou indisponível.";

export const requestClientLinkToken = async (publicId: string, secret: string): Promise<string> => {
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/client/link-login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({ publicId, secret }),
        });
        if (!response.ok) throw new Error();
        const data: unknown = await response.json();
        if (typeof data !== "object" || data === null || !("customToken" in data)
            || typeof data.customToken !== "string" || !data.customToken) throw new Error();
        return data.customToken;
    } catch {
        // Never expose network/SDK response bodies or credential values.
        throw new Error(LINK_LOGIN_ERROR);
    }
};
