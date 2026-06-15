import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import { WhatsappButton } from "./components/WhatsappButton/WhatsappButton";

import Home from "./pages/Home/Home";

function App() {
  return (
    <>
      <Header />

      <Home />

      <Footer />

      <WhatsappButton />
    </>
  );
}

export default App;