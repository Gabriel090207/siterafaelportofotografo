import "./AdminLayout.css";

import {
    useState,
    type ReactNode,
} from "react";

import { Navigate } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";

import Header from "./components/Header/Header";
import Sidebar from "./components/Sidebar/Sidebar";

interface AdminLayoutProps {
    children: ReactNode;
}

const AdminLayout = ({
    children,
}: AdminLayoutProps) => {

    const { user, loading } = useAuth();

    const [sidebarOpen, setSidebarOpen] = useState(false);

    if (loading) {
        return null;
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    return (

        <div className="admin-layout">

            <Header
                sidebarOpen={sidebarOpen}
                onToggleSidebar={() =>
                    setSidebarOpen((prev) => !prev)
                }
            />

            <div className="admin-layout__body">

                <Sidebar
                    isOpen={sidebarOpen}
                    onClose={() =>
                        setSidebarOpen(false)
                    }
                />

                {sidebarOpen && (

                    <div
                        className="admin-layout__overlay"
                        onClick={() =>
                            setSidebarOpen(false)
                        }
                    />

                )}

                <main className="admin-layout__content">

                    {children}

                </main>

            </div>

        </div>

    );

};

export default AdminLayout;