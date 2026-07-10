import { Route, Routes } from "react-router-dom";

import GuestLayout from "../layouts/GuestLayout/GuestLayout";
import AdminLayout from "../layouts/AdminLayout/AdminLayout";

import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";


import Clients from "../pages/Clients/Clients";
import ClientForm from "../pages/ClientForm/ClientForm";

import Albums from "../pages/Albums/Albums";
import AlbumForm from "../pages/AlbumForm/AlbumForm";

const AppRoutes = () => {
    return (
        <Routes>

            <Route
                path="/"
                element={
                    <GuestLayout>
                        <Login />
                    </GuestLayout>
                }
            />

            <Route
                path="/dashboard"
                element={
                    <AdminLayout>
                        <Dashboard />
                    </AdminLayout>
                }
            />

            <Route
                path="/clients"
                element={
                    <AdminLayout>
                        <Clients />
                    </AdminLayout>
                }
            />

            <Route
                path="/albums"
                element={
                    <AdminLayout>
                        <Albums />
                    </AdminLayout>
                }
            />

            <Route
                path="/albums/new"
                element={
                    <AdminLayout>
                        <AlbumForm />
                    </AdminLayout>
                }
            />

            <Route
                path="/clients/new"
                element={
                    <AdminLayout>
                        <ClientForm />
                    </AdminLayout>
                }
            />

        </Routes>
    );
};

export default AppRoutes;