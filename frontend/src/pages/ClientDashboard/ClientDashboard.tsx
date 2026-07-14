import "./ClientDashboard.css";

import {
    useEffect,
    useState,
} from "react";

import { Link } from "react-router-dom";

import {
    Calendar,
    MapPin,
    Images,
    Video,
} from "lucide-react";

import ClientHeader from "../../components/ClientHeader/ClientHeader";

import { subscribeClientAlbums } from "../../firebase/albums";

function ClientDashboard() {

    const client = JSON.parse(
        localStorage.getItem("client") ?? "{}"
    );

    const [albums, setAlbums] =
        useState<any[]>([]);

    useEffect(() => {

        if (!client.id) return;

        const unsubscribe =
            subscribeClientAlbums(
                client.id,
                setAlbums
            );

        return unsubscribe;

    }, [client.id]);

    return (

        <main className="client-dashboard">

            <ClientHeader />

            <div className="client-dashboard__container">

                <section className="client-dashboard__hero">

                    <span>

                        BEM-VINDO

                    </span>

                    <h1>

                        Seus Álbuns

                    </h1>

                    <p>

                        Você possui {albums.length} álbum{albums.length !== 1 ? "s" : ""} disponível{albums.length !== 1 ? "is" : ""}.

                    </p>

                </section>

                <section className="client-dashboard__albums">

                    {albums.length === 0 ? (

                        <p>

                            Nenhum álbum disponível.

                        </p>

                    ) : (

                        albums.map((album) => {

                            const totalPhotos =
                                album.watermarkedPhotos?.length ?? 0;

                            const totalVideos =
                                album.watermarkedVideos?.length ?? 0;

                            return (

                                <article
                                    key={album.id}
                                    className="client-album-card"
                                >

                                    <div className="client-album-card__image">

                                        {album.coverPhoto?.preview ? (

                                            <img
                                                src={album.coverPhoto.preview}
                                                alt={album.name}
                                            />

                                        ) : (

                                            <Images size={40} />

                                        )}

                                    </div>

                                    <div className="client-album-card__content">

                                        <h2>

                                            {album.name}

                                        </h2>

                                        <div className="client-album-card__info">

                                            <span>

                                                <Calendar size={15} />

                                                {album.eventDate
                                                    ? new Date(
                                                          album.eventDate
                                                      ).toLocaleDateString(
                                                          "pt-BR"
                                                      )
                                                    : "Sem data"}

                                            </span>

                                            <span>

                                                <MapPin size={15} />

                                                {album.eventLocation ??
                                                    "Sem local"}

                                            </span>

                                        </div>

                                        <div className="client-album-card__footer">

                                            <span>

                                                <Images size={16} />

                                                {totalPhotos} Foto{totalPhotos !== 1 ? "s" : ""}

                                            </span>

                                            <span>

                                                <Video size={16} />

                                                {totalVideos} Vídeo{totalVideos !== 1 ? "s" : ""}

                                            </span>

                                            <Link
                                                to={`/evento/${album.id}`}
                                            >

                                                Ver Álbum

                                            </Link>

                                        </div>

                                    </div>

                                </article>

                            );

                        })

                    )}

                </section>

            </div>

        </main>

    );

}

export default ClientDashboard;