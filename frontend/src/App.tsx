import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";

import { WhatsappButton } from "./components/WhatsappButton/WhatsappButton";

import { AppRoutes } from "./routes/AppRoutes";

import { useLocation } from "react-router-dom";

function App() {

  const location = useLocation();

  const isClientArea =
    location.pathname.startsWith("/cliente");

  return (
    <>

      {!isClientArea && <Header />}

      <AppRoutes />

      {!isClientArea && <Footer />}

      {!isClientArea && <WhatsappButton />}

    </>
  );
}

export default App;