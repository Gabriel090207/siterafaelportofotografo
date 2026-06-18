import "./Header.css";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

import logo from "../../assets/logo/logo.png";

function Header() {

const [menuOpen, setMenuOpen] = useState(false);

const [eventsOpen, setEventsOpen] = useState(false);

const [desktopEventsOpen, setDesktopEventsOpen] = useState(false);

useEffect(() => {
  document.body.classList.toggle(
    "menu-open",
    menuOpen
  );

  if (!menuOpen) {
    setEventsOpen(false);
  }
}, [menuOpen]);

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
  <Link to="/">Início</Link>

 <div
  className="nav-dropdown"
  onMouseEnter={() => setDesktopEventsOpen(true)}
  onMouseLeave={() => setDesktopEventsOpen(false)}
>
   <span className="nav-dropdown-title">
  Eventos
</span>

 <div
  className={`dropdown-menu ${
    desktopEventsOpen ? "active" : ""
  }`}
>
  <Link
  to="/eventos?categoria=casamentos"
  onClick={() => setDesktopEventsOpen(false)}
>
  Casamentos
</Link>

<Link
  to="/eventos?categoria=15-anos"
  onClick={() => setDesktopEventsOpen(false)}
>
  15 Anos
</Link>

<Link
  to="/eventos?categoria=pre-wedding"
  onClick={() => setDesktopEventsOpen(false)}
>
  Pré Wedding
</Link>

<Link
  to="/eventos?categoria=book-15"
  onClick={() => setDesktopEventsOpen(false)}
>
  Book de 15 Anos
</Link>

<Link
  to="/eventos?categoria=infantil"
  onClick={() => setDesktopEventsOpen(false)}
>
  Infantil
</Link>

<Link
  to="/eventos?categoria=gestante"
  onClick={() => setDesktopEventsOpen(false)}
>
  Book de Gestante
</Link>

<Link
  to="/eventos?categoria=aniversarios"
  onClick={() => setDesktopEventsOpen(false)}
>
  Aniversários
</Link>

<Link
  to="/eventos?categoria=ensaio"
  onClick={() => setDesktopEventsOpen(false)}
>
  Ensaio Fotográfico
</Link>

<Link
  to="/eventos?categoria=corporativo"
  onClick={() => setDesktopEventsOpen(false)}
>
  Corporativos
</Link>

<Link
  to="/eventos?categoria=formaturas"
  onClick={() => setDesktopEventsOpen(false)}
>
  Formaturas
</Link>
</div>
  </div>

  <a href="#">Serviços</a>
  <a href="#">Depoimentos</a>
  <a href="#">Promoções</a>
  <a href="#">Sobre</a>
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
  <Link to="/">Início</Link>

 <div className="mobile-dropdown">
  <button
    className="mobile-dropdown-trigger"
    onClick={() => setEventsOpen(!eventsOpen)}
  >
    <span>Eventos</span>

    <span
      className={`mobile-arrow ${
        eventsOpen ? "active" : ""
      }`}
    ></span>
  </button>

  <div
    className={`mobile-submenu ${
      eventsOpen ? "active" : ""
    }`}
  >
    <a href="#">Casamentos</a>
    <a href="#">15 Anos</a>
    <a href="#">Pré Wedding</a>
    <a href="#">Book de 15 Anos</a>
    <a href="#">Infantil</a>
    <a href="#">Book de Gestante</a>
    <a href="#">Aniversários</a>
    <a href="#">Ensaio Fotográfico</a>
    <a href="#">Corporativos</a>
    <a href="#">Formaturas</a>
  </div>
</div>

  <a href="#">Serviços</a>
  <a href="#">Depoimentos</a>
  <a href="#">Promoções</a>
  <a href="#">Sobre</a>
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