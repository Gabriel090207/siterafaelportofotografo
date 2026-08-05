import "./Footer.css";

import {
    useEffect,
    useState,
} from "react";

import { Link } from "react-router-dom";

import {
    Mail,
    MapPin,
} from "lucide-react";

import {
    FaFacebookF,
    FaInstagram,
    FaWhatsapp,
    FaYoutube,
} from "react-icons/fa";

import logo from "../../assets/logo/logoabout.png";

import {
    subscribeFeedCategories,
} from "../../services/firebase/feedCategory";

import type {
    FeedCategory,
} from "../../services/firebase/feedCategory";

function Footer() {

    const currentYear = new Date().getFullYear();

    const [categories, setCategories] =
        useState<FeedCategory[]>([]);

    useEffect(() => {

        const unsubscribe =
            subscribeFeedCategories(
                setCategories
            );

        return unsubscribe;

    }, []);

    return (

        <footer className="footer">

            <div className="footer-container">

                <div className="footer-brand">

                    <img
                        src={logo}
                        alt="Rafael Porto Fotografia"
                    />

                    <p>

                        Fotografia e filmes para
                        casamentos, 15 anos,
                        ensaios, formaturas e
                        eventos corporativos.

                    </p>

                </div>

                <div className="footer-links">

                    <div className="footer-column">

                        <h4>

                            Navegação

                        </h4>

                        <Link to="/">
                            Início
                        </Link>

                        <Link to="/portfolio">
                            Eventos
                        </Link>

                        <Link to="/servicos">
                            Serviços
                        </Link>

                        <Link to="/depoimentos">
                            Depoimentos
                        </Link>

                        <Link to="/promocoes">
                            Promoções
                        </Link>

                        <Link to="/sobre">
                            Sobre
                        </Link>

                        <Link to="/contato">
                            Contato
                        </Link>

                        <Link
                            to="/cliente"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="footer-client"
                        >

                            Área do Cliente

                        </Link>

                    </div>

                    <div className="footer-column">

                        <h4>

                            Categorias

                        </h4>

                        {categories.map((category) => (

                            <Link
                                key={category.id}
                                to={`/eventos/${encodeURIComponent(
                                    category.name
                                )}`}
                            >

                                {category.name}

                            </Link>

                        ))}

                    </div>

                    <div className="footer-column">

                        <h4>

                            Contato

                        </h4>

                        <a
                            href="https://wa.me/5543988237222"
                            target="_blank"
                            rel="noopener noreferrer"
                        >

                            <FaWhatsapp />

                            WhatsApp

                        </a>

                        <a
                            href="mailto:contato@rafaelporto.com.br"
                        >

                            <Mail size={18} />

                            contato@rafaelporto.com.br

                        </a>

                        <Link to="/contato">

                            <MapPin size={18} />

                            Ver localização

                        </Link>

                        

                    </div>

                    <div className="footer-column">

                        <h4>

                            Redes Sociais

                        </h4>

                        <a
                            href="https://www.instagram.com/rafaelportofotoefilme/"
                            target="_blank"
                            rel="noopener noreferrer"
                        >

                            <FaInstagram />

                            Instagram

                        </a>

                        <a
                            href="https://www.facebook.com/rafaelportofotoevideo/"
                            target="_blank"
                            rel="noopener noreferrer"
                        >

                            <FaFacebookF />

                            Facebook

                        </a>

                        <a
                            href="https://www.youtube.com/user/rafaelbragaporto"
                            target="_blank"
                            rel="noopener noreferrer"
                        >

                            <FaYoutube />

                            YouTube

                        </a>

                    </div>

                </div>

            </div>

            <div className="footer-bottom">

                <p>

                    © {currentYear} Rafael Porto Fotografia.
                    Todos os direitos reservados.

                </p>

            </div>

        </footer>

    );

}

export default Footer;