import { Route, Routes } from "react-router-dom";

import ScrollToTop from "../components/ScrollToTop/ScrollToTop";

import Home from "../pages/Home/Home";
import Events from "../pages/Events/Events";
import Event from "../pages/Event/Event";
import About from "../pages/About/About";
import Services from "../pages/Services/Services";
import Contact from "../pages/Contact/Contact";

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
        path="/eventos"
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