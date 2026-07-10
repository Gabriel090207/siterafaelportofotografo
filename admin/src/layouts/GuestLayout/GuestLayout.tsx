import "./GuestLayout.css";

import type { ReactNode } from "react";

import { Navigate } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";

interface GuestLayoutProps {
    children: ReactNode;
}

const GuestLayout = ({
    children,
}: GuestLayoutProps) => {

    const {
        user,
        loading,
    } = useAuth();

    if (loading) {
        return null;
    }

    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <>
            {children}
        </>
    );

};

export default GuestLayout;