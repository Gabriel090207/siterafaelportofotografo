import { Route, Routes } from "react-router-dom";

import ScrollToTop from "../components/ScrollToTop/ScrollToTop";

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
          path="/eventos/:categoryName"
          element={<Events />}
      />
            
      <Route
          path="/evento/:id"
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
        element={<ClientLogin />}
      />

      <Route
          path="/cliente/dashboard"
          element={<ClientDashboard />}
      />

      <Route
          path="/cliente/album/:albumId"
          element={<ClientAlbum />}
      />

      <Route
          path="/cliente/downloads"
          element={<ClientDownloads />}
      />

    </Routes>
        </>
  );
} 