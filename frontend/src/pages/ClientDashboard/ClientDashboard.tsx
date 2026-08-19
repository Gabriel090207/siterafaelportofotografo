import "./ClientDashboard.css";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    FiArrowRight,
    FiCalendar,
    FiImage,
    FiMapPin,
    FiVideo,
} from "react-icons/fi";

import ClientHeader from "../../components/ClientHeader/ClientHeader";
import {
    getClientAlbums,
    type ClientAlbumSummary,
} from "../../services/api/clientAlbums";

function ClientDashboard() {
    const [albums, setAlbums] = useState<ClientAlbumSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isActive = true;
        const controller = new AbortController();

        const loadAlbums = async () => {
            try {
                const receivedAlbums = await getClientAlbums(
                    controller.signal
                );

                if (isActive) {
                    setAlbums(receivedAlbums);
                }
            } catch (error) {
                if (!controller.signal.aborted) {
                    console.error("Erro ao carregar álbuns:", error);
                }
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        };

        void loadAlbums();

        return () => {
            isActive = false;
            controller.abort();
        };
    }, []);

    return (
        <main className="client-dashboard">
            <ClientHeader />

            <div className="client-dashboard__container">
                <header className="client-dashboard__intro">
                    <div className="client-dashboard__eyebrow">
                        <span />
                        <p>ÁREA DO CLIENTE</p>
                    </div>

                    <h1>Seus álbuns</h1>

                    <p className="client-dashboard__description">
                        Reviva seus momentos e explore as fotos e vídeos
                        disponíveis em cada álbum.
                    </p>
                </header>

                {(loading || albums.length > 0) && (
                    <section className="client-dashboard__albums">
                        <div className="client-dashboard__section-label">
                            <span />
                            <p>SUA GALERIA</p>
                        </div>

                        <div className="client-dashboard__grid">
                            {loading
                                ? [1, 2, 3].map((item) => (
                                      <article
                                          key={item}
                                          className="client-album-card client-album-card--loading"
                                          aria-hidden="true"
                                      >
                                          <div className="client-album-card__skeleton-image" />
                                          <div className="client-album-card__skeleton-content">
                                              <div className="client-album-card__skeleton-line client-album-card__skeleton-line--title" />
                                              <div className="client-album-card__skeleton-line client-album-card__skeleton-line--details" />
                                              <div className="client-album-card__skeleton-line client-album-card__skeleton-line--media" />
                                              <div className="client-album-card__skeleton-button" />
                                          </div>
                                      </article>
                                  ))
                                : albums.map((album) => {
                                      const totalPhotos =
                                          album.photoCount;
                                      const totalVideos =
                                          album.videoCount;

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
                                                      <div className="client-album-card__image-empty">
                                                          <FiImage aria-hidden="true" />
                                                          <span>Sem imagem de capa</span>
                                                      </div>
                                                  )}
                                              </div>

                                              <div className="client-album-card__content">
                                                  <h2>{album.name}</h2>

                                                  {(album.eventDate || album.eventLocation) && (
                                                      <div className="client-album-card__details">
                                                          {album.eventDate && (
                                                              <span>
                                                                  <FiCalendar aria-hidden="true" />
                                                                  {new Date(album.eventDate).toLocaleDateString(
                                                                      "pt-BR",
                                                                      {
                                                                          day: "2-digit",
                                                                          month: "long",
                                                                          year: "numeric",
                                                                      }
                                                                  )}
                                                              </span>
                                                          )}

                                                          {album.eventLocation && (
                                                              <span>
                                                                  <FiMapPin aria-hidden="true" />
                                                                  {album.eventLocation}
                                                              </span>
                                                          )}
                                                      </div>
                                                  )}

                                                  <div className="client-album-card__media">
                                                      <span>
                                                          <FiImage aria-hidden="true" />
                                                          {totalPhotos} {totalPhotos === 1 ? "foto" : "fotos"}
                                                      </span>

                                                      <span>
                                                          <FiVideo aria-hidden="true" />
                                                          {totalVideos} {totalVideos === 1 ? "vídeo" : "vídeos"}
                                                      </span>
                                                  </div>

                                                  <Link
                                                      to={`/cliente/albuns/${album.slug}`}
                                                      className="client-album-card__button"
                                                  >
                                                      <span>Ver álbum</span>
                                                      <FiArrowRight aria-hidden="true" />
                                                  </Link>
                                              </div>
                                          </article>
                                      );
                                  })}
                        </div>
                    </section>
                )}

                {!loading && albums.length === 0 && (
                    <section className="client-dashboard__empty">
                        <div className="client-dashboard__empty-icon">
                            <FiImage aria-hidden="true" />
                        </div>
                        <h2>Nenhum álbum disponível</h2>
                        <p>
                            Quando seus álbuns estiverem disponíveis, eles
                            aparecerão aqui para você explorar.
                        </p>
                    </section>
                )}
            </div>
        </main>
    );
}

export default ClientDashboard;
