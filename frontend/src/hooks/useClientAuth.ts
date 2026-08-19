import { useContext } from "react";

import ClientAuthContext from "../contexts/ClientAuthContext";

export function useClientAuth() {
    const context = useContext(ClientAuthContext);

    if (!context) {
        throw new Error(
            "useClientAuth deve ser usado dentro do ClientAuthProvider"
        );
    }

    return context;
}
