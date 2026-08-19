import "./ClientDownloads.css";

import { useEffect, useRef, useState } from "react";
import {
    FiClock,
    FiDownload,
    FiImage,
    FiVideo,
} from "react-icons/fi";

import ClientHeader from "../../components/ClientHeader/ClientHeader";
import {
    downloadClientAlbum,
    getClientAlbums,
    type ClientAlbumSummary,
} from "../../services/api/clientAlbums";
import { ClientApiError } from "../../services/api/clientApi";

type DownloadDeadline =
    | { status: "without-deadline"; label: string }
    | { status: "available"; label: string; expiresAt: number }
    | { status: "expired"; label: string }
    | { status: "invalid"; label: string };

const getDownloadDeadline = (
    album: ClientAlbumSummary,
    now: number
): DownloadDeadline => {
    const downloadDays = album.highQualityDownloadDays;

    if (downloadDays === null) {
        return {
            status: "without-deadline",
            label: "Disponível sem prazo",
        };
    }

    if (
        typeof downloadDays !== "number" ||
        !Number.isFinite(downloadDays) ||
        downloadDays <= 0 ||
        !album.createdAt
    ) {
        return {
            status: "invalid",
            label: "Prazo indisponível",
        };
    }

    const createdAt = new Date(album.createdAt);

    const createdAtTime = createdAt.getTime();

    if (!Number.isFinite(createdAtTime)) {
        return {
            status: "invalid",
            label: "Prazo indisponível",
        };
    }

    const expiresAt = createdAtTime + downloadDays * 24 * 60 * 60 * 1000;

    if (!Number.isFinite(expiresAt)) {
        return {
            status: "invalid",
            label: "Prazo indisponível",
        };
    }

    if (now >= expiresAt) {
        return {
            status: "expired",
            label: "Prazo encerrado",
        };
    }

    const remainingMilliseconds = expiresAt - now;

    if (remainingMilliseconds < 60_000) {
        return {
            status: "available",
            label: "Menos de 1min restante",
            expiresAt,
        };
    }

    const totalMinutes = Math.ceil(remainingMilliseconds / 60_000);
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;
    const parts: string[] = [];

    if (days > 0) {
        parts.push(`${days}d`);
    }

    if (hours > 0 || days > 0) {
        parts.push(`${String(hours).padStart(2, "0")}h`);
    }

    parts.push(`${String(minutes).padStart(2, "0")}min`);

    return {
        status: "available",
        label: `${parts.join(" ")} restantes`,
        expiresAt,
    };
};

const sanitizeZipFilename = (
    value: string,
    fallbackName: string
) => {
    const filename = value
        .split(/[\\/]/)
        .pop()
        ?.replace(/[\u0000-\u001f\u007f]/g, "")
        .replace(/[<>:"|?*%]/g, "-")
        .trim()
        .replace(/^[. ]+|[. ]+$/g, "")
        .slice(0, 180);

    const safeName = filename || fallbackName;

    return safeName.toLowerCase().endsWith(".zip")
        ? safeName
        : `${safeName}.zip`;
};

const getResponseFilename = (
    contentDisposition: string | null,
    albumName: string
) => {
    const fallbackName = sanitizeZipFilename(albumName, "album");

    if (!contentDisposition) {
        return fallbackName;
    }

    const encodedMatch = contentDisposition.match(
        /filename\*\s*=\s*UTF-8''([^;]+)/i
    );
    const regularMatch = contentDisposition.match(
        /filename\s*=\s*(?:"([^"]+)"|([^;]+))/i
    );

    let headerName = encodedMatch?.[1] || regularMatch?.[1] || regularMatch?.[2];

    if (!headerName) {
        return fallbackName;
    }

    headerName = headerName.trim();

    if (encodedMatch) {
        try {
            headerName = decodeURIComponent(headerName);
        } catch {
            return fallbackName;
        }
    }

    return sanitizeZipFilename(headerName, fallbackName);
};

const getDownloadErrorMessage = (error: ClientApiError) => {
    if (
        error.message
        && error.message !== "A solicitação não pôde ser concluída."
    ) {
        return error.message;
    }

    switch (error.status) {
        case 410:
            return "O prazo de download deste álbum expirou.";
        case 403:
            return "Este álbum não pertence ao cliente autenticado.";
        case 404:
            return "O álbum ou seus arquivos não foram encontrados.";
        case 422:
            return "Os dados de download deste álbum estão inválidos.";
        case 502:
            return "Não foi possível obter os arquivos no armazenamento.";
        default:
            return "Não foi possível preparar o download. Tente novamente.";
    }
};

function ClientDownloads() {
    const [albums, setAlbums] = useState<ClientAlbumSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(() => Date.now());
    const [downloadingAlbumIds, setDownloadingAlbumIds] = useState<Set<string>>(
        () => new Set()
    );
    const downloadLockRef = useRef<Set<string>>(new Set());

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

    useEffect(() => {
        let timeoutId: number;

        const updateClock = () => {
            const now = Date.now();
            setCurrentTime(now);

            const nextExpiration = albums.reduce<number | null>(
                (closest, album) => {
                    const deadline = getDownloadDeadline(album, now);

                    if (deadline.status !== "available") {
                        return closest;
                    }

                    if (closest === null || deadline.expiresAt < closest) {
                        return deadline.expiresAt;
                    }

                    return closest;
                },
                null
            );

            const timeUntilExpiration = nextExpiration === null
                ? 60_000
                : Math.max(0, nextExpiration - now);
            const nextUpdateIn = Math.min(60_000, timeUntilExpiration);

            timeoutId = window.setTimeout(
                updateClock,
                nextUpdateIn
            );
        };

        updateClock();

        return () => window.clearTimeout(timeoutId);
    }, [albums]);

    const getAlbumName = (album: ClientAlbumSummary) =>
        album.name || "Álbum sem nome";

    const getAlbumCover = (album: ClientAlbumSummary) =>
        album.coverPhoto?.preview || "";

    const getPhotoCount = (album: ClientAlbumSummary) =>
        album.photoCount;

    const getVideoCount = (album: ClientAlbumSummary) =>
        album.videoCount;

    const handleDownloadAlbum = async (album: ClientAlbumSummary) => {
        const deadline = getDownloadDeadline(album, Date.now());

        if (
            downloadLockRef.current.has(album.id) ||
            deadline.status === "expired" ||
            deadline.status === "invalid"
        ) {
            return;
        }

        downloadLockRef.current.add(album.id);
        setDownloadingAlbumIds((current) => {
            const next = new Set(current);
            next.add(album.id);
            return next;
        });

        try {
            const response = await downloadClientAlbum(album.id);

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            try {
                const link = document.createElement("a");
                link.href = url;
                link.download = getResponseFilename(
                    response.headers.get("Content-Disposition"),
                    getAlbumName(album)
                );

                document.body.appendChild(link);
                link.click();
                link.remove();
            } finally {
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error("Erro ao baixar álbum:", error);

            if (error instanceof ClientApiError) {
                if (error.status !== 401 && error.status !== 403) {
                    alert(getDownloadErrorMessage(error));
                }
            } else {
                alert("Não foi possível preparar o download. Tente novamente.");
            }
        } finally {
            downloadLockRef.current.delete(album.id);
            setDownloadingAlbumIds((current) => {
                const next = new Set(current);
                next.delete(album.id);
                return next;
            });
        }
    };

    return (
        <main className="client-downloads">
            <ClientHeader />

            <div className="client-downloads__container">
                <header className="client-downloads__intro">
                    <div className="client-downloads__eyebrow">
                        <span />
                        <p>ÁREA DO CLIENTE</p>
                    </div>

                    <h1>Downloads em alta qualidade</h1>

                    <p className="client-downloads__description">
                        Baixe as fotos e os vídeos dos seus álbuns em alta
                        resolução enquanto os arquivos estiverem disponíveis.
                    </p>

                </header>

                {(loading || albums.length > 0) && (
                    <section className="client-downloads__albums">
                        <div className="client-downloads__section-label">
                            <span />
                            <p>SEUS ÁLBUNS</p>
                        </div>

                        <div className="client-downloads__grid">
                            {loading
                                ? [1, 2, 3].map((item) => (
                                      <article
                                          key={item}
                                          className="download-card download-card--loading"
                                          aria-hidden="true"
                                      >
                                          <div className="download-card__skeleton-image" />
                                          <div className="download-card__skeleton-content">
                                              <div className="download-card__skeleton-line download-card__skeleton-line--title" />
                                              <div className="download-card__skeleton-line download-card__skeleton-line--meta" />
                                              <div className="download-card__skeleton-footer">
                                                  <div className="download-card__skeleton-line download-card__skeleton-line--deadline" />
                                                  <div className="download-card__skeleton-button" />
                                              </div>
                                          </div>
                                      </article>
                                  ))
                                : albums.map((album) => {
                                      const cover = getAlbumCover(album);
                                      const photoCount = getPhotoCount(album);
                                      const videoCount = getVideoCount(album);
                                      const isDownloading = downloadingAlbumIds.has(album.id);
                                      const deadline = getDownloadDeadline(album, currentTime);
                                      const isUnavailable =
                                          deadline.status === "expired" ||
                                          deadline.status === "invalid";

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
                                                          <FiImage aria-hidden="true" />
                                                          <span>Sem imagem de capa</span>
                                                      </div>
                                                  )}
                                              </div>

                                              <div className="download-card__content">
                                                  <h2>{getAlbumName(album)}</h2>

                                                  <div className="download-card__media">
                                                      <span>
                                                          <FiImage aria-hidden="true" />
                                                          {photoCount} {photoCount === 1 ? "foto" : "fotos"}
                                                      </span>

                                                      <span>
                                                          <FiVideo aria-hidden="true" />
                                                          {videoCount} {videoCount === 1 ? "vídeo" : "vídeos"}
                                                      </span>
                                                  </div>

                                                  <div className="download-card__footer">
                                                      <div className="download-card__deadline">
                                                          <FiClock aria-hidden="true" />
                                                          <span>{deadline.label}</span>
                                                      </div>

                                                      <button
                                                          type="button"
                                                          className="download-card__button"
                                                          onClick={() => handleDownloadAlbum(album)}
                                                          disabled={isDownloading || isUnavailable}
                                                      >
                                                          <span>
                                                              {isDownloading
                                                                  ? "Preparando download..."
                                                                  : isUnavailable
                                                                    ? "Download indisponível"
                                                                    : "Baixar arquivos"}
                                                          </span>
                                                          <FiDownload aria-hidden="true" />
                                                      </button>
                                                  </div>
                                              </div>
                                          </article>
                                      );
                                  })}
                        </div>
                    </section>
                )}

                {!loading && albums.length === 0 && (
                    <section className="client-downloads__empty">
                        <div className="client-downloads__empty-icon">
                            <FiDownload aria-hidden="true" />
                        </div>
                        <h2>Nenhum álbum disponível</h2>
                        <p>
                            Quando houver arquivos em alta qualidade, seus
                            álbuns aparecerão aqui para download.
                        </p>
                    </section>
                )}
            </div>
        </main>
    );
}

export default ClientDownloads;
