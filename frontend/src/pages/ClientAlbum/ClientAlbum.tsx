import "./ClientAlbum.css";

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    CalendarDays,
    Check,
    Heart,
    Image,
    MapPin,
    Video,
    X,
} from "lucide-react";

import ClientHeader from "../../components/ClientHeader/ClientHeader";
import LoadingModal from "../../components/LoadingModal/LoadingModal";
import { useToast } from "../../contexts/ToastContext";
import {
    createClientAlbumSelection,
    resolveClientAlbum,
    type ClientAlbumDetails,
    type ClientAlbumMedia,
} from "../../services/api/clientAlbums";
import { ClientApiError } from "../../services/api/clientApi";

const OVERLAY_ANIMATION_MS = 300;

function ClientAlbum() {
    const { albumSlug, identifier } = useParams();
    const routeIdentifier = albumSlug ?? identifier;
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [album, setAlbum] = useState<ClientAlbumDetails | null>(null);
    const [resolvedAlbumId, setResolvedAlbumId] = useState<string | null>(null);
    const [resolutionState, setResolutionState] = useState<
        "resolving" | "found" | "notFound" | "error"
    >("resolving");
    const [filter, setFilter] = useState("photos");
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);

    const [showFinishModal, setShowFinishModal] = useState(false);
    const [finishModalMounted, setFinishModalMounted] = useState(false);
    const [closingFinishModal, setClosingFinishModal] = useState(false);

    const [previewImage, setPreviewImage] = useState<
        (ClientAlbumMedia & { mediaType: "photo" | "video" }) | null
    >(null);
    const [closingPreview, setClosingPreview] = useState(false);

    const [selectionName, setSelectionName] = useState("");
    const [personName, setPersonName] = useState("");
    const [email, setEmail] = useState("");

    const finishModalTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const finishModalClosePromise = useRef<Promise<void> | null>(null);
    const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [loadingModal, setLoadingModal] = useState({
        open: false,
        success: false,
        progress: 0,
        title: "Salvando seleção",
        message: "Preparando...",
    });

    const updateLoading = (progress: number, message: string) => {
        setLoadingModal((current) => ({
            ...current,
            progress,
            message,
        }));
    };

    const closeLoading = async () => {
        setLoadingModal((current) => ({
            ...current,
            open: false,
        }));

        await new Promise((resolve) => setTimeout(resolve, 350));
    };

    useEffect(() => {
        if (!routeIdentifier) return;

        let isActive = true;
        const controller = new AbortController();

        const loadAlbum = async () => {
            setAlbum(null);
            setResolvedAlbumId(null);
            setResolutionState("resolving");

            try {
                const result = await resolveClientAlbum(
                    routeIdentifier,
                    controller.signal
                );

                if (isActive) {
                    setAlbum(result.album);
                    setResolvedAlbumId(result.albumId);
                    setResolutionState("found");

                    if (!albumSlug || !result.isCanonical) {
                        navigate(
                            `/cliente/albuns/${result.canonicalSlug}`,
                            { replace: true }
                        );
                    }
                }
            } catch (error) {
                if (!controller.signal.aborted) {
                    console.error("Erro ao carregar álbum:", error);

                    if (isActive) {
                        setResolutionState(
                            error instanceof ClientApiError
                            && error.status === 404
                                ? "notFound"
                                : "error"
                        );
                    }
                }
            }
        };

        void loadAlbum();

        return () => {
            isActive = false;
            controller.abort();
        };
    }, [albumSlug, navigate, routeIdentifier]);

    useEffect(() => {
        return () => {
            if (finishModalTimer.current) {
                clearTimeout(finishModalTimer.current);
            }

            if (previewTimer.current) {
                clearTimeout(previewTimer.current);
            }
        };
    }, []);

    const items =
        filter === "photos"
            ? album?.watermarkedPhotos ?? []
            : album?.watermarkedVideos ?? [];

    const openFinishModal = () => {
        if (selectedItems.length === 0) {
            showToast(
                "Escolha pelo menos uma foto antes de finalizar a seleção.",
                "warning"
            );
            return;
        }

        if (finishModalTimer.current) {
            clearTimeout(finishModalTimer.current);
            finishModalTimer.current = null;
        }

        finishModalClosePromise.current = null;
        setClosingFinishModal(false);
        setFinishModalMounted(true);
        setShowFinishModal(true);
    };

    const closeFinishModal = () => {
        if (!finishModalMounted) return Promise.resolve();

        if (finishModalClosePromise.current) {
            return finishModalClosePromise.current;
        }

        setShowFinishModal(false);
        setClosingFinishModal(true);

        const closePromise = new Promise<void>((resolve) => {
            finishModalTimer.current = setTimeout(() => {
                setFinishModalMounted(false);
                setClosingFinishModal(false);
                finishModalTimer.current = null;
                finishModalClosePromise.current = null;
                resolve();
            }, OVERLAY_ANIMATION_MS);
        });

        finishModalClosePromise.current = closePromise;
        return closePromise;
    };

    const openPreview = (
        item: ClientAlbumMedia,
        mediaType: "photo" | "video"
    ) => {
        if (previewTimer.current) return;

        setClosingPreview(false);
        setPreviewImage({
            ...item,
            mediaType,
        });
    };

    const closePreview = () => {
        if (!previewImage || previewTimer.current) return;

        setClosingPreview(true);
        previewTimer.current = setTimeout(() => {
            setPreviewImage(null);
            setClosingPreview(false);
            previewTimer.current = null;
        }, OVERLAY_ANIMATION_MS);
    };

    useEffect(() => {
        if (!finishModalMounted && !previewImage) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [finishModalMounted, previewImage]);

    useEffect(() => {
        if (!finishModalMounted && !previewImage) return;

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;

            if (previewImage) {
                closePreview();
                return;
            }

            if (finishModalMounted && !loadingModal.open) {
                void closeFinishModal();
            }
        };

        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [finishModalMounted, loadingModal.open, previewImage]);

    const toggleSelection = (id: string) => {
        setSelectedItems((current) =>
            current.includes(id)
                ? current.filter((item) => item !== id)
                : [...current, id]
        );
    };

    const handleFinishSelection = async () => {
        if (!resolvedAlbumId || !album) return;
        if (!selectionName.trim()) return;
        if (!personName.trim()) return;
        if (!email.trim()) return;
        if (selectedItems.length === 0) return;

        await closeFinishModal();

        setLoadingModal({
            open: true,
            success: false,
            progress: 0,
            title: "Salvando seleção",
            message: "Preparando...",
        });

        updateLoading(20, "Preparando seleção...");

        try {
            updateLoading(70, "Salvando no banco de dados...");
            await createClientAlbumSelection(resolvedAlbumId, {
                selectionName: selectionName.trim(),
                personName: personName.trim(),
                email: email.trim(),
                photoIds: selectedItems,
            });

            setLoadingModal((current) => ({
                ...current,
                success: true,
                progress: 100,
                message: "Seleção salva com sucesso!",
            }));

            await new Promise((resolve) => setTimeout(resolve, 900));
            await closeLoading();

            setSelectionName("");
            setPersonName("");
            setEmail("");
            setSelectedItems([]);
            setSelectionMode(false);
        } catch (error) {
            await closeLoading();
            console.error(error);
        }
    };

    const eventDate = album?.eventDate
        ? new Date(album.eventDate).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
          })
        : null;
    const hasLoadedAlbum = resolutionState !== "resolving";
    const albumWasFound = resolutionState === "found" && album !== null;

    return (
        <main className="client-album">
            <ClientHeader />

            <div className="client-album__container">
                <Link to="/cliente/dashboard" className="client-album__back">
                    <ArrowLeft size={17} aria-hidden="true" />
                    Voltar aos álbuns
                </Link>

                <header className="client-album__intro">
                    <div className="client-album__eyebrow">
                        <span />
                        <p>ÁREA DO CLIENTE</p>
                    </div>

                    {albumWasFound ? (
                        <>
                            <h1>{album.name}</h1>

                            {(eventDate || album?.eventLocation) && (
                                <div className="client-album__details">
                                    {eventDate && (
                                        <span>
                                            <CalendarDays size={18} aria-hidden="true" />
                                            {eventDate}
                                        </span>
                                    )}

                                    {album.eventLocation && (
                                        <span>
                                            <MapPin size={18} aria-hidden="true" />
                                            {album.eventLocation}
                                        </span>
                                    )}
                                </div>
                            )}
                        </>
                    ) : resolutionState === "resolving" ? (
                        <div className="client-album__intro-skeleton" aria-hidden="true">
                            <span className="client-album__skeleton-line client-album__skeleton-line--title" />
                            <span className="client-album__skeleton-line client-album__skeleton-line--detail" />
                        </div>
                    ) : (
                        <h1>
                            {resolutionState === "notFound"
                                ? "Álbum não encontrado"
                                : "Não foi possível carregar o álbum"}
                        </h1>
                    )}
                </header>

                <section className="client-album__content" aria-label="Conteúdo do álbum">
                    {albumWasFound && (
                    <div className="client-album__controls">
                        <div className="client-album__tabs" aria-label="Tipo de mídia">
                            <button
                                type="button"
                                className={filter === "photos" ? "client-album__tab client-album__tab--active" : "client-album__tab"}
                                onClick={() => setFilter("photos")}
                                aria-pressed={filter === "photos"}
                            >
                                <Image size={17} aria-hidden="true" />
                                Fotos
                            </button>
                            <button
                                type="button"
                                className={filter === "videos" ? "client-album__tab client-album__tab--active" : "client-album__tab"}
                                onClick={() => setFilter("videos")}
                                aria-pressed={filter === "videos"}
                                disabled={selectionMode}
                            >
                                <Video size={17} aria-hidden="true" />
                                Vídeos
                            </button>
                        </div>

                        {filter === "photos" && (
                            <button
                                type="button"
                                className={selectionMode ? "client-album__selection client-album__selection--active" : "client-album__selection"}
                                onClick={() => setSelectionMode(!selectionMode)}
                            >
                                {selectionMode ? <X size={18} aria-hidden="true" /> : <Heart size={18} aria-hidden="true" />}
                                {selectionMode ? "Cancelar seleção" : "Criar seleção"}
                            </button>
                        )}
                    </div>
                    )}

                    {!hasLoadedAlbum ? (
                        <div className="client-album__gallery client-album__gallery--loading" aria-label="Carregando álbum">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                                <div key={item} className="client-media-card client-media-card--loading" aria-hidden="true" />
                            ))}
                        </div>
                    ) : resolutionState === "notFound" ? (
                        <div className="client-album__empty">
                            <div className="client-album__empty-icon">
                                <Image size={30} aria-hidden="true" />
                            </div>
                            <h2>Álbum não encontrado</h2>
                            <p>
                                Este álbum não está disponível para a sua conta.
                            </p>
                        </div>
                    ) : resolutionState === "error" ? (
                        <div className="client-album__empty">
                            <div className="client-album__empty-icon">
                                <Image size={30} aria-hidden="true" />
                            </div>
                            <h2>Não foi possível carregar o álbum</h2>
                            <p>Tente novamente em alguns instantes.</p>
                        </div>
                    ) : items.length > 0 ? (
                        <div className="client-album__gallery">
                            {items.map((item) => {
                                const isSelected = selectedItems.includes(item.id);

                                return (
                                    <div
                                        key={item.id}
                                        className={isSelected ? "client-media-card client-media-card--selected" : "client-media-card"}
                                        onClick={() => openPreview(item, filter === "photos" ? "photo" : "video")}
                                    >
                                        {selectionMode && (
                                            <button
                                                type="button"
                                                className={isSelected ? "client-media-card__favorite client-media-card__favorite--active" : "client-media-card__favorite"}
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    toggleSelection(item.id);
                                                }}
                                                aria-label={isSelected ? `Remover ${item.name} da seleção` : `Adicionar ${item.name} à seleção`}
                                                aria-pressed={isSelected}
                                            >
                                                {isSelected ? <Check size={18} aria-hidden="true" /> : <Heart size={18} aria-hidden="true" />}
                                            </button>
                                        )}

                                        {filter === "photos" && item.preview ? (
                                            <img
                                                src={item.preview}
                                                alt={item.name}
                                                loading="lazy"
                                                decoding="async"
                                            />
                                        ) : filter === "videos" && item.preview ? (
                                            <video
                                                src={item.preview}
                                                muted
                                                playsInline
                                                preload="metadata"
                                            />
                                        ) : (
                                            <div className="client-media-card__video">
                                                <Video size={34} aria-hidden="true" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="client-album__empty">
                            <div className="client-album__empty-icon">
                                {filter === "photos" ? <Image size={30} aria-hidden="true" /> : <Video size={30} aria-hidden="true" />}
                            </div>
                            <h2>{filter === "photos" ? "Nenhuma foto disponível" : "Nenhum vídeo disponível"}</h2>
                            <p>
                                {filter === "photos"
                                    ? "Este álbum ainda não possui fotos disponíveis para visualização."
                                    : "Este álbum ainda não possui vídeos disponíveis para visualização."}
                            </p>
                        </div>
                    )}
                </section>
            </div>

            {selectionMode && albumWasFound && (
                <div className="client-album__selection-bar">
                    <p>
                        <strong>{selectedItems.length}</strong>{" "}
                        {selectedItems.length === 1 ? "foto selecionada" : "fotos selecionadas"}
                    </p>
                    <button type="button" onClick={openFinishModal}>
                        Finalizar seleção
                        <Check size={18} aria-hidden="true" />
                    </button>
                </div>
            )}

            {finishModalMounted && (
                <div
                    className={closingFinishModal || !showFinishModal ? "client-album-modal client-album-modal--closing" : "client-album-modal"}
                    onClick={() => void closeFinishModal()}
                    role="presentation"
                >
                    <div
                        className="client-album-modal__content"
                        onClick={(event) => event.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="finish-selection-title"
                    >
                        <button
                            type="button"
                            className="client-album-modal__close"
                            onClick={() => void closeFinishModal()}
                            aria-label="Fechar"
                        >
                            <X size={20} aria-hidden="true" />
                        </button>

                        <div className="client-album-modal__eyebrow">SUA SELEÇÃO</div>
                        <h2 id="finish-selection-title" className="client-album-modal__title">
                            Finalizar seleção
                        </h2>

                        <div className="client-album-modal__group">
                            <label htmlFor="selection-name">Nome da seleção</label>
                            <input
                                id="selection-name"
                                type="text"
                                placeholder="Ex.: Família da Noiva"
                                value={selectionName}
                                onChange={(event) => setSelectionName(event.target.value)}
                            />
                        </div>

                        <div className="client-album-modal__row">
                            <div className="client-album-modal__group">
                                <label htmlFor="person-name">Nome da pessoa</label>
                                <input
                                    id="person-name"
                                    type="text"
                                    placeholder="Nome completo"
                                    value={personName}
                                    onChange={(event) => setPersonName(event.target.value)}
                                />
                            </div>

                            <div className="client-album-modal__group">
                                <label htmlFor="selection-email">E-mail</label>
                                <input
                                    id="selection-email"
                                    type="email"
                                    placeholder="Digite seu e-mail"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="button"
                            className="client-album-modal__submit"
                            onClick={handleFinishSelection}
                        >
                            Completar
                        </button>
                    </div>
                </div>
            )}

            {previewImage && (
                <div
                    className={closingPreview ? "client-preview client-preview--closing" : "client-preview"}
                    onClick={closePreview}
                    role="presentation"
                >
                    <button
                        type="button"
                        className="client-preview__close"
                        onClick={(event) => {
                            event.stopPropagation();
                            closePreview();
                        }}
                        aria-label="Fechar visualização"
                    >
                        <X size={24} aria-hidden="true" />
                    </button>

                    <div
                        className="client-preview__content"
                        onClick={(event) => event.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-label={previewImage.name}
                    >
                        {previewImage.mediaType === "photo" ? (
                            <img src={previewImage.preview} alt={previewImage.name} />
                        ) : (
                            <video
                                src={previewImage.preview}
                                controls
                                playsInline
                                preload="metadata"
                            />
                        )}
                    </div>
                </div>
            )}

            <LoadingModal
                open={loadingModal.open}
                progress={loadingModal.progress}
                title={loadingModal.title}
                message={loadingModal.message}
                success={loadingModal.success}
            />
        </main>
    );
}

export default ClientAlbum;
