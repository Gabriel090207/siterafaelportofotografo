import { createContext } from "react";
import type { User } from "firebase/auth";

import type { ClientSessionProfile } from "../services/api/clientSession";

export type ClientAuthStatus =
    | "initializing"
    | "authenticated"
    | "unauthenticated";

export interface ClientAuthContextValue {
    status: ClientAuthStatus;
    user: User | null;
    client: ClientSessionProfile | null;
    logout: () => Promise<boolean>;
}

const ClientAuthContext = createContext<ClientAuthContextValue | null>(null);

export default ClientAuthContext;
