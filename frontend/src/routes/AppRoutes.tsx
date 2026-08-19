import { Route, Routes } from "react-router-dom";

import ScrollToTop from "../components/ScrollToTop/ScrollToTop";
import {
  ClientGuestRoute,
  ClientProtectedRoute,
} from "../components/ClientProtectedRoute/ClientProtectedRoute";

import Home from "../pages/Home/Home";
import Portfolio from "../pages/Portfolio/Portfolio";
import Events from "../pages/Events/Events";
import Event from "../pages/Event/Event";
import About from "../pages/About/About";
import Services from "../pages/Services/Services";
import Contact from "../pages/Contact/Contact";
import Testimonials from "../pages/Testimonials/Testimonials";
import Promocoes from "../pages/Promocoes/Promocoes";

import ClientLogin from "../pages/ClientLogin/ClientLogin";
import ClientDashboard from "../pages/ClientDashboard/ClientDashboard";
import ClientAlbum from "../pages/ClientAlbum/ClientAlbum";
import ClientDownloads from "../pages/ClientDownloads/ClientDownloads";
import ClientTestimonials from "../pages/ClientTestimonials/ClientTestimonials";
import ClientSelections from "../pages/ClientSelections/ClientSelections";
import ClientSelectionDetails from "../pages/ClientSelectionDetails/ClientSelectionDetails";

export function AppRoutes() {


  return (
 <>
      <ScrollToTop />

    <Routes>
      <Route
        path="/"
        element={<Home />}
      />

      <Route
          path="/portfolio"
          element={<Portfolio />}
      />

      <Route
          path="/eventos"
          element={<Events />}
      />

      <Route
          path="/eventos/:categoryPath"
          element={<Events />}
      />

      <Route
          path="/eventos/:categorySlug/:albumSlug"
          element={<Event />}
      />
            
      <Route
          path="/evento/:identifier"
          element={<Event />}
      />

      <Route
        path="/sobre"
        element={<About />}
      />


      <Route
        path="/servicos"
        element={<Services />}
      />

      <Route
        path="/contato"
        element={<Contact />}
      />

      <Route
          path="/depoimentos"
          element={<Testimonials />}
      />

      <Route
          path="/promocoes"
          element={<Promocoes />}
      />


      <Route
        path="/cliente"
        element={
          <ClientGuestRoute>
            <ClientLogin />
          </ClientGuestRoute>
        }
      />

      <Route element={<ClientProtectedRoute />}>
        <Route
          path="/cliente/dashboard"
          element={<ClientDashboard />}
        />

        <Route
          path="/cliente/albuns/:albumSlug"
          element={<ClientAlbum />}
        />

        <Route
          path="/cliente/album/:identifier"
          element={<ClientAlbum />}
        />

        <Route
          path="/cliente/downloads"
          element={<ClientDownloads />}
        />

        <Route
          path="/cliente/depoimentos"
          element={<ClientTestimonials />}
        />

        <Route
          path="/cliente/selecoes"
          element={<ClientSelections />}
        />

        <Route
          path="/cliente/selecoes/:selectionId"
          element={<ClientSelectionDetails />}
        />
      </Route>

    </Routes>
        </>
  );
}
