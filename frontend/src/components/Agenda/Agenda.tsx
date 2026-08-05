import "./Agenda.css";

import {
    useEffect,
    useState,
} from "react";

import {
    subscribeSiteAgenda,
} from "../../services/firebase/siteAgenda";

import type {
    SiteAgenda,
} from "../../services/firebase/siteAgenda";

function Agenda() {

    const [agenda, setAgenda] =
        useState<SiteAgenda | null>(null);

    useEffect(() => {

        const unsubscribe =
            subscribeSiteAgenda((data) => {

                setAgenda(data);

            });

        return unsubscribe;

    }, []);

    return (

        <section className="agenda">

            <div className="agenda-container">

                <div className="agenda-content">

                    <div className="section-eyebrow">

                        <span />

                        <p>

                            {agenda?.eyebrow}

                        </p>

                    </div>

                    <h2>

                        {agenda?.title}

                    </h2>

                    <p className="agenda-description">

                        {agenda?.description}

                    </p>

                </div>

                <div className="agenda-actions">

                    <a
                        href="https://wa.me/55SEUNUMERO"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="agenda-primary-btn"
                    >

                        Consultar minha data

                    </a>

                </div>

            </div>

        </section>

    );

}

export default Agenda;