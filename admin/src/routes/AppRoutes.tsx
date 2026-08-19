import { Navigate, Route, Routes } from "react-router-dom";

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

import Events from "../pages/Events/Events";
import EventForm from "../pages/EventForm/EventForm";
import EventCategory from "../pages/EventCategory/EventCategory";
import HiddenEvents from "../pages/HiddenEvents/HiddenEvents";
import EditEvent from "../pages/EditEvent/EditEvent";

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

            {/* Módulo Eventos */}

            <Route
                path="/eventos"
                element={
                    <AdminLayout>
                        <Events />
                    </AdminLayout>
                }
            />

            <Route
                path="/eventos/novo"
                element={<Navigate to="/eventos" replace />}
            />

            <Route
                path="/eventos/ocultos"
                element={
                    <AdminLayout>
                        <HiddenEvents />
                    </AdminLayout>
                }
            />

            <Route
                path="/eventos/:categorySlug/novo"
                element={
                    <AdminLayout>
                        <EventForm />
                    </AdminLayout>
                }
            />

            <Route
                path="/eventos/:categorySlug/:albumSlug"
                element={
                    <AdminLayout>
                        <EditEvent />
                    </AdminLayout>
                }
            />

            <Route
                path="/eventos/:categorySlug"
                element={
                    <AdminLayout>
                        <EventCategory />
                    </AdminLayout>
                }
            />

            <Route path="/feed" element={<Navigate to="/eventos" replace />} />
            <Route path="/feed/new" element={<Navigate to="/eventos" replace />} />
            <Route path="/feed/hidden" element={<Navigate to="/eventos/ocultos" replace />} />

            <Route
                path="/feed/:categoryIdentifier/edit/:albumIdentifier"
                element={
                    <AdminLayout>
                        <EditEvent />
                    </AdminLayout>
                }
            />

            <Route
                path="/feed/:categoryIdentifier"
                element={
                    <AdminLayout>
                        <EventCategory />
                    </AdminLayout>
                }
            />

            {/* Futuro módulo Álbum do Cliente */}

            <Route
                path="/albuns"
                element={
                    <AdminLayout>
                        <Albums />
                    </AdminLayout>
                }
            />

            <Route
                path="/albuns/novo"
                element={
                    <AdminLayout>
                        <AlbumForm />
                    </AdminLayout>
                }
            />


            <Route
                path="/albuns/:albumSlug"
                element={
                    <AdminLayout>
                        <EditAlbum />
                    </AdminLayout>
                }
            />

            <Route path="/albums" element={<Navigate to="/albuns" replace />} />
            <Route path="/albums/new" element={<Navigate to="/albuns/novo" replace />} />

            <Route
                path="/albums/:identifier/edit"
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
