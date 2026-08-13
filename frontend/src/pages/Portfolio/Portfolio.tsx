import "./Portfolio.css";

import {
    useEffect,
    useState,
} from "react";

import {
    Link,
} from "react-router-dom";

import {
    FiArrowRight,
    FiCamera,
} from "react-icons/fi";

import {
    subscribeFeedCategories,
} from "../../services/firebase/feedCategory";

import type {
    FeedCategory,
} from "../../services/firebase/feedCategory";


function Portfolio() {

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

        <main className="portfolio-page">

            <div className="portfolio-page-container">


                {/* =========================
                    HEADER
                ========================= */}

                <section className="portfolio-page-header">

                    <div className="portfolio-page-eyebrow">

                        <span></span>

                        <p>
                            PORTFÓLIO
                        </p>

                    </div>


                    <h1>
                        Histórias registradas
                        para sempre.
                    </h1>


                    <p className="portfolio-page-description">

                        Conheça alguns dos momentos que já
                        tivemos o privilégio de registrar.
                        Escolha uma categoria e explore
                        nossos álbuns.

                    </p>

                </section>


                {/* =========================
                    CATEGORIAS
                ========================= */}

                <section className="portfolio-page-categories">

                    <div className="portfolio-page-grid">

                        {categories.map((category) => (

                            <article
                                key={category.id}
                                className="portfolio-page-card"
                            >

                                {/* CAPA */}

                                <div className="portfolio-page-card-image">

                                    {category.cover ? (

                                        <img
                                            src={category.cover}
                                            alt={category.name}
                                        />

                                    ) : (

                                        <div className="portfolio-page-card-placeholder">

                                            <FiCamera />

                                        </div>

                                    )}

                                </div>


                                {/* CONTEÚDO */}

                                <div className="portfolio-page-card-content">

                                    <h2>
                                        {category.name}
                                    </h2>


                                    <Link
                                        to={`/eventos/${encodeURIComponent(
                                            category.name
                                        )}`}
                                        className="portfolio-page-card-button"
                                    >

                                        <span>
                                            Ver Eventos
                                        </span>

                                        <FiArrowRight />

                                    </Link>

                                </div>

                            </article>

                        ))}

                    </div>

                </section>


            </div>

        </main>

    );

}

export default Portfolio;