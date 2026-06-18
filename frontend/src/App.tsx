import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";

import { WhatsappButton } from "./components/WhatsappButton/WhatsappButton";

import { AppRoutes } from "./routes/AppRoutes";

function App() {
  return (
    <>
      <Header />

      <AppRoutes />

      <Footer />

      <WhatsappButton />
    </>
  );
}

export default App;