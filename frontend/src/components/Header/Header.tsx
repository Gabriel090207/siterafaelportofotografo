import "./Header.css";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

import {
    subscribeFeedCategories,
} from "../../services/firebase/feedCategory";

import type {
    FeedCategory,
} from "../../services/firebase/feedCategory";

import logo from "../../assets/logo/logo.png";

function Header() {

const [menuOpen, setMenuOpen] = useState(false);

const [eventsOpen, setEventsOpen] = useState(false);

const [desktopEventsOpen, setDesktopEventsOpen] = useState(false);

const [categories, setCategories] = useState<FeedCategory[]>([]);

useEffect(() => {
  document.body.classList.toggle(
    "menu-open",
    menuOpen
  );

  if (!menuOpen) {
    setEventsOpen(false);
  }
}, [menuOpen]);

useEffect(() => {

    const unsubscribe =
        subscribeFeedCategories(
            setCategories
        );

    return unsubscribe;

}, []);

  return (
  <header className="header">
      <div className="topbar">
        <div className="topbar-container">
          <p>
            Nº 1 do público pelo 3º ano consecutivo • Fotografia e filme em
            Londrina e região
          </p>

          <div className="topbar-links">
            <a href="https://wa.me/5543988237222"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp">WhatsApp: (43) 98823-7222</a>

            <span>•</span>

            <a href="https://wa.me/5543988237222" target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp">Contato</a>
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
  {categories.map((category) => (
  <Link
    key={category.id}
    to={`/eventos/${encodeURIComponent(category.name)}`}
    onClick={() => setDesktopEventsOpen(false)}
>
    {category.name}
</Link>
))}
</div>
  </div>

  
<Link to="/depoimentos">Depoimentos</Link>
<Link to="/promocoes">Promoções</Link>
  <Link to="/sobre">
  Sobre
</Link>
  <Link to="/contato">
  Contato
</Link>
</nav>

          <div className="navbar-actions">
 <Link
  to="/cliente"
  target="_blank"
  rel="noopener noreferrer"
  className="btn-client"
>
  Área do Cliente
</Link>

<Link
  to="https://wa.me/5543988237222"
  target="_blank"
  rel="noopener noreferrer"
  className="btn-budget"
>
  Pedir orçamento
</Link>

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
  <Link to="/"
    onClick={() => setMenuOpen(false)}
    >Início</Link>

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
    {categories.map((category) => (

    <Link
        key={category.id}
        to={`/eventos/${encodeURIComponent(category.name)}`}
        onClick={() => {
            setMenuOpen(false);
            setEventsOpen(false);
        }}
    >
        {category.name}
    </Link>

))}
  </div>
</div>

  
   <Link
  to="/depoimentos"
  onClick={() => setMenuOpen(false)}
>
  Depoimentos
</Link>

<Link
  to="/promocoes"
  onClick={() => setMenuOpen(false)}
>
  Promoções
</Link>
 <Link
  to="/sobre"
  onClick={() => setMenuOpen(false)}
>
  Sobre
</Link>
  <Link to="/contato"
   onClick={() => setMenuOpen(false)}>
  Contato
</Link>
</nav>

  <div className="mobile-actions">
<Link
  to="/cliente"
  target="_blank"
  rel="noopener noreferrer"
  className="mobile-btn-client"
  onClick={() => setMenuOpen(false)}
>
  Área do Cliente
</Link>
 <Link
  to="https://wa.me/5543988237222"
  target="_blank"
  rel="noopener noreferrer"
  className="mobile-btn-budget"
  onClick={() => setMenuOpen(false)}
>
  Pedir orçamento
</Link>
</div>

</aside>

    </header>
  );
}

export default Header;