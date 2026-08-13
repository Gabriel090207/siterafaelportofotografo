import "./Events.css";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Link,
    useParams,
} from "react-router-dom";

import { subscribeAlbums } from "../../services/firebase/feed";

import {
    subscribeFeedCategories,
} from "../../services/firebase/feedCategory";

import type {
    FeedCategory,
} from "../../services/firebase/feedCategory";

function Events() {

const {
    categoryName,
} = useParams();

const [albums, setAlbums] = useState<any[]>([]);

const [categories, setCategories] =
    useState<FeedCategory[]>([]);

const currentCategory =
    categories.find(
        category =>
            category.name ===
            decodeURIComponent(
                categoryName ?? ""
            )
    );

    useEffect(() => {

        const unsubscribe =
            subscribeAlbums(setAlbums);

        return unsubscribe;

    }, []);

    useEffect(() => {

    const unsubscribe =
        subscribeFeedCategories(
            setCategories
        );

    return unsubscribe;

}, []);

    const events = useMemo(() => {

    return albums.filter(album => {

        if (album.status !== "published") {
            return false;
        }

        if (!currentCategory) {
            return true;
        }

        return (
            album.category ===
            currentCategory.id
        );

    });

}, [
    albums,
    currentCategory,
]);

    const featuredAlbum = events[0];

    const otherAlbums = events.slice(1);

    return (

        <main className="events">

            <div className="events-container">

                <section className="events-hero">

                    <div className="events-eyebrow">

                        <span></span>

                        <p>

                            PORTFÓLIO DE EVENTOS

                        </p>

                    </div>

                    <div className="events-hero-content">

                        <h1>

                            {currentCategory?.name ?? "Eventos"}

                        </h1>

                        <p className="events-description">

                            Fotógrafo a mais de 16 anos e especialista em festa de 15 anos, casamentos, formaturas, pré wedding, ensaio de gestante, eventos corporativos, aniversário infantil e book, Rafael Porto foi o primeiro fotógrafo no Brasil a entregar um álbum no próprio casamento, ama surpreender seus clientes e transformar momentos únicos em recordações eternas, possui mais de 50 prêmios por atendimento e qualidade, a empresa é a mais indicada em sua região a 6 anos consecutivos, atende Paraná e região. Tenha a tranquilidade e segurança em obter as melhores imagens dos momentos mais importantes da vida.

                        </p>

                    </div>

                </section>

                {featuredAlbum && (

                    <section className="featured-event">

                        <div className="featured-event-card">

                            <img
                                src={
                                    featuredAlbum.coverPhoto?.preview
                                }
                                alt={
                                    featuredAlbum.name
                                }
                            />

                            <div className="featured-event-overlay">

                                <span className="featured-event-label">

                                    {currentCategory?.name}

                                </span>

                                <h2>

                                    {featuredAlbum.name}

                                </h2>

                                <p>

                                    {featuredAlbum.description}

                                </p>

                                <Link
                                    to={`/evento/${featuredAlbum.id}`}
                                    className="featured-event-button"
                                >

                                    Ver Álbum

                                </Link>

                            </div>

                        </div>

                    </section>

                )}

                <section className="events-grid-section">

                    <div className="events-grid">

                        {otherAlbums.map((album) => (

                            <article
                                key={album.id}
                                className="event-card"
                            >

                                <div className="event-card-header">

                                    <div>

                                        <h3>

                                            {album.name}

                                        </h3>

                                        <span>

                                            {currentCategory?.name}

                                            {" • "}

                                            {album.clientName}

                                        </span>

                                    </div>

                                    <Link
                                        to={`/evento/${album.id}`}
                                        className="event-card-button"
                                    >

                                        Ver Álbum

                                    </Link>

                                </div>

                                <div className="event-card-image">

                                    <img
                                        src={
                                            album.coverPhoto?.preview
                                        }
                                        alt={
                                            album.name
                                        }
                                    />

                                </div>

                                <div className="event-card-content">

                                    <p>

                                        {album.description}

                                    </p>

                                </div>

                            </article>

                        ))}

                    </div>

                </section>

            </div>

        </main>

    );

}

export default Events;