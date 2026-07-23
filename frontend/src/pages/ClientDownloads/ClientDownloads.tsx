import "./ClientDownloads.css";

import { useEffect, useState } from "react";

import {
    CalendarDays,
    Clock3,
    Download,
    HardDrive,
    Image,
    Images,
    Video,
} from "lucide-react";

import ClientHeader from "../../components/ClientHeader/ClientHeader";

// Troque pelo mesmo método usado no seu ClientDashboard.
import { subscribeClientAlbums } from "../../firebase/albums";

interface AlbumItem {
    id: string;
    title?: string;
    name?: string;
    cover?: string;
    coverUrl?: string;
    thumbnail?: string;
    watermarkedPhotos?: any[];
    watermarkedVideos?: any[];
    downloadEnabled?: boolean;
    downloadExpiresAt?: any;
    downloadSize?: string;
}

function ClientDownloads() {

    const [albums, setAlbums] = useState<AlbumItem[]>([]);

    const [loading, setLoading] = useState(true);

    const client = JSON.parse(
        localStorage.getItem("client") ?? "{}"
    );

    useEffect(() => {

        if (!client?.id) {

            setLoading(false);

            return;

        }

        /*
            Use aqui a mesma função que você já utiliza
            no ClientDashboard para buscar os álbuns.

            Exemplo esperado:

            subscribeClientAlbums(client.id, callback)
        */

        const unsubscribe = subscribeClientAlbums(
            client.id,
            (receivedAlbums: AlbumItem[]) => {

                setAlbums(receivedAlbums ?? []);

                setLoading(false);

            }
        );

        return () => {

            if (typeof unsubscribe === "function") {

                unsubscribe();

            }

        };

    }, [client?.id]);

    const getAlbumName = (album: AlbumItem) => {

        return (
            album.title ||
            album.name ||
            "Álbum sem nome"
        );

    };

    const getAlbumCover = (album: AlbumItem) => {

        return (
            album.cover ||
            album.coverUrl ||
            album.thumbnail ||
            album.watermarkedPhotos?.[0]?.preview ||
            ""
        );

    };

    const getPhotoCount = (album: AlbumItem) => {

        return album.watermarkedPhotos?.length ?? 0;

    };

    const getVideoCount = (album: AlbumItem) => {

        return album.watermarkedVideos?.length ?? 0;

    };

    return (

        <main className="client-downloads">

            <ClientHeader />

            <div className="client-downloads__container">

                <section className="client-downloads__hero">

                    <div className="client-downloads__hero-icon">

                        <Download size={30} />

                    </div>

                    <div className="client-downloads__hero-content">

                        <span className="client-downloads__eyebrow">

                            ARQUIVOS EM ALTA RESOLUÇÃO

                        </span>

                        <h1>

                            Downloads

                        </h1>

                        <p>

                            Encontre seus álbuns e baixe as fotografias
                            em alta qualidade quando estiverem disponíveis.

                        </p>

                    </div>

                </section>

                <section className="client-downloads__information">

                    <div className="client-downloads__information-icon">

                        <HardDrive size={22} />

                    </div>

                    <div>

                        <strong>

                            Seus arquivos estarão disponíveis por tempo limitado

                        </strong>

                        <p>

                            O prazo e os botões de download serão liberados
                            pelo fotógrafo após a entrega final do álbum.

                        </p>

                    </div>

                </section>

                <div className="client-downloads__heading">

                    <div>

                        <span>

                            SEUS ÁLBUNS

                        </span>

                        <h2>

                            Disponíveis para download

                        </h2>

                    </div>

                    {!loading && albums.length > 0 && (

                        <div className="client-downloads__total">

                            <Images size={18} />

                            {albums.length}

                            {albums.length === 1
                                ? " álbum"
                                : " álbuns"}

                        </div>

                    )}

                </div>

                {loading && (

                    <section className="client-downloads__grid">

                        {[1, 2, 3].map((item) => (

                            <div
                                key={item}
                                className="download-card download-card--loading"
                            >

                                <div className="download-card__skeleton-image" />

                                <div className="download-card__skeleton-content">

                                    <div className="download-card__skeleton-line download-card__skeleton-line--title" />

                                    <div className="download-card__skeleton-line" />

                                    <div className="download-card__skeleton-line download-card__skeleton-line--small" />

                                </div>

                            </div>

                        ))}

                    </section>

                )}

                {!loading && albums.length > 0 && (

                    <section className="client-downloads__grid">

                        {albums.map((album) => {

                            const cover = getAlbumCover(album);

                            const photoCount = getPhotoCount(album);

                            const videoCount = getVideoCount(album);

                            return (

                                <article
                                    key={album.id}
                                    className="download-card"
                                >

                                    <div className="download-card__cover">

                                        {cover ? (

                                            <img
                                                src={cover}
                                                alt={getAlbumName(album)}
                                            />

                                        ) : (

                                            <div className="download-card__cover-empty">

                                                <Image size={42} />

                                                <span>

                                                    Sem imagem de capa

                                                </span>

                                            </div>

                                        )}

                                        <div className="download-card__cover-overlay" />

                                        <span className="download-card__status">

                                            Disponível em breve

                                        </span>

                                    </div>

                                    <div className="download-card__content">

                                        <div className="download-card__title-area">

                                            <span className="download-card__label">

                                                ÁLBUM

                                            </span>

                                            <h3>

                                                {getAlbumName(album)}

                                            </h3>

                                        </div>

                                        <div className="download-card__media-info">

                                            <div>

                                                <Images size={17} />

                                                <span>

                                                    {photoCount}

                                                    {photoCount === 1
                                                        ? " foto"
                                                        : " fotos"}

                                                </span>

                                            </div>

                                            {videoCount > 0 && (

                                                <div>

                                                    <Video size={17} />

                                                    <span>

                                                        {videoCount}

                                                        {videoCount === 1
                                                            ? " vídeo"
                                                            : " vídeos"}

                                                    </span>

                                                </div>

                                            )}

                                        </div>

                                        <div className="download-card__divider" />

                                        <div className="download-card__timer">

                                            <div className="download-card__timer-heading">

                                                <Clock3 size={18} />

                                                <span>

                                                    Tempo para download

                                                </span>

                                            </div>

                                            <div className="download-card__countdown">

                                                <div>

                                                    <strong>

                                                        --

                                                    </strong>

                                                    <span>

                                                        Dias

                                                    </span>

                                                </div>

                                                <span className="download-card__separator">

                                                    :

                                                </span>

                                                <div>

                                                    <strong>

                                                        --

                                                    </strong>

                                                    <span>

                                                        Horas

                                                    </span>

                                                </div>

                                                <span className="download-card__separator">

                                                    :

                                                </span>

                                                <div>

                                                    <strong>

                                                        --

                                                    </strong>

                                                    <span>

                                                        Minutos

                                                    </span>

                                                </div>

                                            </div>

                                            <div className="download-card__date">

                                                <CalendarDays size={16} />

                                                Data de expiração será informada

                                            </div>

                                        </div>

                                        <button
                                            type="button"
                                            className="download-card__button"
                                            disabled
                                        >

                                            <Download size={19} />

                                            Baixar fotos em alta

                                        </button>

                                        <p className="download-card__notice">

                                            O download será liberado quando os arquivos
                                            em alta resolução estiverem prontos.

                                        </p>

                                    </div>

                                </article>

                            );

                        })}

                    </section>

                )}

                {!loading && albums.length === 0 && (

                    <section className="client-downloads__empty">

                        <div className="client-downloads__empty-icon">

                            <Download size={38} />

                        </div>

                        <h2>

                            Nenhum álbum disponível

                        </h2>

                        <p>

                            Quando seus álbuns forem liberados, eles aparecerão
                            aqui para download em alta qualidade.

                        </p>

                    </section>

                )}

            </div>

        </main>

    );

}

export default ClientDownloads;