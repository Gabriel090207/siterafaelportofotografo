import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";

import { WhatsappButton } from "./components/WhatsappButton/WhatsappButton";

import { AppRoutes } from "./routes/AppRoutes";

import { useLocation } from "react-router-dom";
import { ClientAuthProvider } from "./contexts/ClientAuthProvider";
import { ToastProvider } from "./contexts/ToastContext";

function App() {

  const location = useLocation();

  const isClientArea =
    location.pathname.startsWith("/cliente");

  return (
    <ToastProvider>
      <ClientAuthProvider>

        {!isClientArea && <Header />}

        <AppRoutes />

        {!isClientArea && <Footer />}

        {!isClientArea && <WhatsappButton />}

      </ClientAuthProvider>
    </ToastProvider>
  );
}

export default App;
