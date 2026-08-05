import "./CTA.css";

import {
    useEffect,
    useState,
} from "react";

import logo from "../../assets/logo/logo1.png";

import { Link } from "react-router-dom";

import {
    subscribeSiteCta,
} from "../../services/firebase/siteCta";

import type {
    SiteCta,
} from "../../services/firebase/siteCta";

function CTA() {

    const [cta, setCta] =
        useState<SiteCta | null>(null);

    useEffect(() => {

        const unsubscribe =
            subscribeSiteCta((data) => {

                setCta(data);

            });

        return unsubscribe;

    }, []);

    return (

        <section className="cta">

            <div className="cta-container">

                <div className="cta-logo">

                    <img
                        src={logo}
                        alt="Rafael Porto"
                    />

                </div>

                <h2>

                    {cta?.title}

                </h2>

                <p className="cta-description">

                    {cta?.description}

                </p>

                <div className="cta-buttons">

                    <a
                        href="https://wa.me/5543988237222"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cta-primary"
                    >

                        Chamar no WhatsApp

                    </a>

                    <a
                        href="mailto:contato@rafaelporto.com.br"
                        className="cta-secondary"
                    >

                        Enviar e-mail

                    </a>

                    <Link
                        to="/contato"
                        className="cta-secondary"
                    >

                        Ver localização

                    </Link>

                </div>

            </div>

        </section>

    );

}

export default CTA;