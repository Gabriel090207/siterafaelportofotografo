import { Route, Routes } from "react-router-dom";

import GuestLayout from "../layouts/GuestLayout/GuestLayout";
import AdminLayout from "../layouts/AdminLayout/AdminLayout";

import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";

import Clients from "../pages/Clients/Clients";
import ClientForm from "../pages/ClientForm/ClientForm";

import Albums from "../pages/Albums/Albums";
import AlbumForm from "../pages/AlbumForm/AlbumForm";

import Feed from "../pages/Feed/Feed";
import FeedForm from "../pages/FeedForm/FeedForm";
import FeedCategory from "../pages/FeedCategory/FeedCategory";

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
                path="/clients/new"
                element={
                    <AdminLayout>
                        <ClientForm />
                    </AdminLayout>
                }
            />

            {/* Módulo Feed */}

            <Route
                path="/feed"
                element={
                    <AdminLayout>
                        <Feed />
                    </AdminLayout>
                }
            />

            <Route
                path="/feed/new"
                element={
                    <AdminLayout>
                        <FeedForm />
                    </AdminLayout>
                }
            />


            <Route
                path="/feed/:category"
                element={
                    <AdminLayout>
                        <FeedCategory />
                    </AdminLayout>
                }
            />

            {/* Futuro módulo Álbum do Cliente */}

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



        </Routes>
    );
};

export default AppRoutes;