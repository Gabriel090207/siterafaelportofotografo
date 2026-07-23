import "./Events.css";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import { Link } from "react-router-dom";

import { subscribeAlbums } from "../../firebase/feed";

function Events() {

    const [albums, setAlbums] = useState<any[]>([]);

    useEffect(() => {

        const unsubscribe =
            subscribeAlbums(setAlbums);

        return unsubscribe;

    }, []);

    const events = useMemo(() => {

        return albums.filter(
            album => album.status === "published"
        );

    }, [albums]);

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

                            {featuredAlbum
                                ? featuredAlbum.category
                                : "Eventos"}

                        </h1>

                        <p className="events-description">

                            Casamentos, 15 anos, ensaios,
                            formaturas e eventos corporativos
                            registrados com emoção, estética
                            e cuidado em cada detalhe.

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

                                    {featuredAlbum.category}

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

                                            {album.category}

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