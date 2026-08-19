import "./ClientProtectedRoute.css";

import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { useClientAuth } from "../../hooks/useClientAuth";

function ClientAuthLoading() {
    return (
        <main
            className="client-auth-loading"
            aria-live="polite"
            aria-busy="true"
        >
            <span className="client-auth-loading__spinner" aria-hidden="true" />
            <p>Carregando...</p>
        </main>
    );
}

export function ClientProtectedRoute() {
    const { status } = useClientAuth();

    if (status === "initializing") {
        return <ClientAuthLoading />;
    }

    if (status === "unauthenticated") {
        return <Navigate to="/cliente" replace />;
    }

    return <Outlet />;
}

export function ClientGuestRoute({ children }: { children: ReactNode }) {
    const { status } = useClientAuth();

    if (status === "initializing") {
        return <ClientAuthLoading />;
    }

    if (status === "authenticated") {
        return <Navigate to="/cliente/dashboard" replace />;
    }

    return children;
}
