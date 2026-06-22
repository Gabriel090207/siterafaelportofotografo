import { Route, Routes } from "react-router-dom";

import ScrollToTop from "../components/ScrollToTop/ScrollToTop";

import Home from "../pages/Home/Home";
import Events from "../pages/Events/Events";
import Event from "../pages/Event/Event";
import About from "../pages/About/About";

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
        path="/evento"
        element={<Event />}
      />

      <Route
        path="/sobre"
        element={<About />}
      />
    </Routes>
        </>
  );
}