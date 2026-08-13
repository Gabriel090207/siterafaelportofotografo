import { Route, Routes } from "react-router-dom";

import GuestLayout from "../layouts/GuestLayout/GuestLayout";
import AdminLayout from "../layouts/AdminLayout/AdminLayout";

import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";

import Clients from "../pages/Clients/Clients";
import ClientForm from "../pages/ClientForm/ClientForm";

import Albums from "../pages/Albums/Albums";
import AlbumForm from "../pages/AlbumForm/AlbumForm";
import EditAlbum from "../pages/EditAlbum/EditAlbum";
import Selections from "../pages/Selections/Selections";
import SelectionDetails from "../pages/SelectionDetails/SelectionDetails";

import Feed from "../pages/Feed/Feed";
import FeedForm from "../pages/FeedForm/FeedForm";
import FeedCategory from "../pages/FeedCategory/FeedCategory";
import FeedHidden from "../pages/FeedHidden/FeedHidden";
import EditFeed from "../pages/EditFeed/EditFeed";

import Testimonials from "../pages/Testimonials/Testimonials";
import TestimonialForm from "../pages/TestimonialForm/TestimonialForm";
import EditTestimonial from "../pages/EditTestimonial/EditTestimonial";

import Site from "../pages/Site/Site";
import SiteHero from "../pages/SiteHero/SiteHero";
import SiteExperiences from "../pages/SiteExperiences/SiteExperiences";
import SitePortfolio from "../pages/SitePortfolio/SitePortfolio";
import SiteFilms from "../pages/SiteFilms/SiteFilms";
import SiteProcess from "../pages/SiteProcess/SiteProcess";
import SiteAbout from "../pages/SiteAbout/SiteAbout";
import SiteTestimonials from "../pages/SiteTestimonials/SiteTestimonials";
import SiteAgenda from "../pages/SiteAgenda/SiteAgenda";
import SiteFaq from "../pages/SiteFaq/SiteFaq";
import SiteCta from "../pages/SiteCta/SiteCta";

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
                path="/feed/:categoryId/edit/:albumId"
                element={
                    <AdminLayout>
                        <EditFeed />
                    </AdminLayout>
                }
            />


            <Route
                path="/feed/:categoryId"
                element={
                    <AdminLayout>
                        <FeedCategory />
                    </AdminLayout>
                }
            />

            <Route
                path="/feed/hidden"
                element={<AdminLayout>
                        <FeedHidden />
                    </AdminLayout>}
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


            <Route
                path="/albums/:id/edit"
                element={
                    <AdminLayout>
                        <EditAlbum />
                    </AdminLayout>
                }
            />

            <Route
                path="/selections"
                element={
                    <AdminLayout>
                        <Selections />
                    </AdminLayout>
                }
            />

            <Route
                path="/selections/:clientId/:selectionId"
                element={
                    <AdminLayout>
                        <SelectionDetails />
                    </AdminLayout>
                }
            />

            <Route
                path="/testimonials"
                element={
                    <AdminLayout>
                        <Testimonials />
                    </AdminLayout>
                }
            />

            <Route
                path="/testimonials/new"
                element={
                    <AdminLayout>
                        <TestimonialForm />
                    </AdminLayout>
                }
            />

            <Route
                path="/testimonials/:id/edit"
                element={
                    <AdminLayout>
                        <EditTestimonial />
                    </AdminLayout>
                }
            />

            <Route
                path="/admin/site"
                element={
                    <AdminLayout>
                        <Site />
                    </AdminLayout>
                }
            />

            <Route
                path="/admin/site/hero"
                element={
                    <AdminLayout>
                        <SiteHero />
                    </AdminLayout>
                }
            />

            <Route
                path="/admin/site/experiencias"
                element={
                    <AdminLayout>
                        <SiteExperiences />
                    </AdminLayout>
                }
            />

            <Route
                path="/admin/site/portfolio"
                element={
                    <AdminLayout>
                        <SitePortfolio />
                    </AdminLayout>
                }
            />

            <Route
                path="/admin/site/videos"
                element={
                    <AdminLayout>
                        <SiteFilms />
                    </AdminLayout>
                }
            />

            <Route
                path="/admin/site/processo"
                element={
                    <AdminLayout>
                        <SiteProcess />
                    </AdminLayout>
                }
            />

            <Route
                path="/admin/site/sobre"
                element={
                    <AdminLayout>
                        <SiteAbout />
                    </AdminLayout>
                }
            />

            <Route
                path="/admin/site/prova-social"
                element={
                    <AdminLayout>
                        <SiteTestimonials />
                    </AdminLayout>
                }
            />

            <Route
                path="/admin/site/agenda"
                element={
                    <AdminLayout>
                        <SiteAgenda />
                    </AdminLayout>
                }
            />

            <Route
                path="/admin/site/faq"
                element={
                    <AdminLayout>
                        <SiteFaq />
                    </AdminLayout>
                }
            />

            <Route
                path="/admin/site/cta"
                element={
                    <AdminLayout>
                        <SiteCta />
                    </AdminLayout>
                }
            />

        </Routes>
    );
};

export default AppRoutes;