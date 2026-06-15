import "./Header.css";

import { useState } from "react";
import { Menu, X } from "lucide-react";

import logo from "../../assets/logo/logo.png";

function Header() {

const [menuOpen, setMenuOpen] = useState(false);

  return (
  <header className="header">
      <div className="topbar">
        <div className="topbar-container">
          <p>
            Nº 1 do público pelo 3º ano consecutivo • Fotografia e filme em
            Londrina e região
          </p>

          <div className="topbar-links">
            <a href="#">WhatsApp: (43) 98823-7222</a>

            <span>•</span>

            <a href="#">Contato</a>
          </div>
        </div>
      </div>

      <div className="navbar">
        <div className="navbar-container">
          <a href="/" className="navbar-logo">
            <img src={logo} alt="Rafael Porto Fotografia" />
          </a>

          <nav className="navbar-menu">
            <a href="#">Início</a>
            <a href="#">Fotos</a>
            <a href="#">Vídeos</a>
            <a href="#">Serviços</a>
            <a href="#">Depoimentos</a>
            <a href="#">Promoções</a>
            <a href="#">Contato</a>
          </nav>

          <div className="navbar-actions">
  <button className="btn-client">
    Área do Cliente
  </button>

  <button className="btn-budget">
    Pedir orçamento
  </button>

  <button
    className="menu-toggle"
    onClick={() => setMenuOpen(true)}
    aria-label="Abrir menu"
  >
    <Menu size={18} />
  </button>
</div>
        </div>
      </div>


      <div
  className={`mobile-overlay ${menuOpen ? "active" : ""}`}
  onClick={() => setMenuOpen(false)}
></div>

<aside
  className={`mobile-sidebar ${menuOpen ? "active" : ""}`}
>
  <button
    className="close-sidebar"
    onClick={() => setMenuOpen(false)}
    aria-label="Fechar menu"
  >
    <X size={18} />
  </button>

  <nav className="mobile-menu">
    <a href="#">Início</a>
    <a href="#">Fotos</a>
    <a href="#">Vídeos</a>
    <a href="#">Serviços</a>
    <a href="#">Depoimentos</a>
    <a href="#">Promoções</a>
    <a href="#">Contato</a>
  </nav>

  <div className="mobile-actions">
  <button className="mobile-btn-client">
    Área do Cliente
  </button>

  <button className="mobile-btn-budget">
    Pedir orçamento
  </button>
</div>

</aside>

    </header>
  );
}

export default Header;