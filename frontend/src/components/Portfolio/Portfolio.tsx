import "./Portfolio.css";

import {
    useEffect,
    useState,
} from "react";

import {
    subscribeSitePortfolio,
} from "../../services/firebase/sitePortfolio";

import type {
    SitePortfolio,
} from "../../services/firebase/sitePortfolio";

import { Link } from "react-router-dom";

function Portfolio() {

    const [data, setData] =
        useState<SitePortfolio | null>(null);

    useEffect(() => {

        const unsubscribe =
            subscribeSitePortfolio(
                setData
            );

        return unsubscribe;

    }, []);

    const items =
        data?.items ?? [];

    return (

        <section className="portfolio">

            <div className="portfolio-container">

                <div className="portfolio-content">

                    <div className="section-eyebrow">

                        <span />

                        <p>

                            {data?.eyebrow ||
                                "PORTFÓLIO"}

                        </p>

                    </div>

                    <h2>

                        {data?.title ||
                            "Fotos que fazem você reviver o momento."}

                    </h2>

                    <p className="portfolio-description">

                        {data?.description ||

                            "Uma galeria visual elegante com imagens reais para inspirar noivos, debutantes, famílias e empresas."}

                    </p>

                    <div className="portfolio-buttons">

                        <div className="portfolio-buttons">

                            <Link
                                to="/portfolio"
                                className="portfolio-primary-btn"
                            >

                                Ver galeria completa

                            </Link>

                        </div>

                    </div>

                </div>

                <div className="portfolio-gallery">

                    {items[0] && (

                        <article
                            className="portfolio-card portfolio-card-large"
                        >

                            <img
                                src={items[0].imageUrl}
                                alt={items[0].title}
                            />

                            <div className="portfolio-overlay" />

                            <h3>

                                {items[0].title}

                            </h3>

                        </article>

                    )}

                    {items[1] && (

                        <article
                            className="portfolio-card"
                        >

                            <img
                                src={items[1].imageUrl}
                                alt={items[1].title}
                            />

                            <div className="portfolio-overlay" />

                            <h3>

                                {items[1].title}

                            </h3>

                        </article>

                    )}

                    {items[2] && (

                        <article
                            className="portfolio-card"
                        >

                            <img
                                src={items[2].imageUrl}
                                alt={items[2].title}
                            />

                            <div className="portfolio-overlay" />

                            <h3>

                                {items[2].title}

                            </h3>

                        </article>

                    )}

                    {items[3] && (

                        <article
                            className="portfolio-card portfolio-card-wide"
                        >

                            <img
                                src={items[3].imageUrl}
                                alt={items[3].title}
                            />

                            <div className="portfolio-overlay" />

                            <h3>

                                {items[3].title}

                            </h3>

                        </article>

                    )}

                </div>

            </div>

        </section>

    );

}

export default Portfolio;