import "./ClientSelectionDetails.css";

import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import { Link, useParams } from "react-router-dom";
import {
    ArrowLeft,
    CalendarDays,
    Image,
    Images,
    Mail,
    UserRound,
    X,
} from "lucide-react";

import ClientHeader from "../../components/ClientHeader/ClientHeader";
import { useToast } from "../../contexts/ToastContext";
import {
    ClientSelectionsApiError,
    getClientSelection,
    type ClientSelectionDetails as ClientSelectionDetailsData,
    type ClientSelectionPhoto,
} from "../../services/api/clientSelections";

const LIGHTBOX_ANIMATION_MS = 300;

const formatDate = (value: string | null) => {
    if (!value) return "Data não disponível";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Data não disponível";
    }

    return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
};

function SelectionPhotoCard({
    photo,
    onOpen,
}: {
    photo: ClientSelectionPhoto;
    onOpen: (photo: ClientSelectionPhoto) => void;
}) {
    const [failed, setFailed] = useState(false);
    const showImage = Boolean(photo.preview) && !failed;

    return (
        <button
            type="button"
            className="client-selection-photo"
            onClick={() => onOpen(photo)}
            disabled={!showImage}
            aria-label={showImage ? `Visualizar ${photo.name}` : undefined}
        >
            {showImage ? (
                <img
                    src={photo.preview}
                    alt={photo.name || "Foto selecionada"}
                    loading="lazy"
                    decoding="async"
                    onError={() => setFailed(true)}
                />
            ) : (
                <span className="client-selection-photo__fallback">
                    <Image size={30} aria-hidden="true" />
                    <span>Imagem indisponível</span>
                </span>
            )}
        </button>
    );
}

function ClientSelectionDetails() {
    const { selectionId } = useParams();
    const { showToast } = useToast();
    const [selection, setSelection] =
        useState<ClientSelectionDetailsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [loadFailed, setLoadFailed] = useState(false);
    const [previewPhoto, setPreviewPhoto] =
        useState<ClientSelectionPhoto | null>(null);
    const [closingPreview, setClosingPreview] = useState(false);
    const [previewFailed, setPreviewFailed] = useState(false);
    const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        let isActive = true;

        const loadSelection = async () => {
            if (!selectionId) {
                setNotFound(true);
                setLoading(false);
                return;
            }

            try {
                const data = await getClientSelection(selectionId);

                if (isActive) {
                    setSelection(data);
                }
            } catch (error) {
                console.error("Erro ao carregar seleção:", error);

                if (!isActive) return;

                if (
                    error instanceof ClientSelectionsApiError
                    && error.status === 404
                ) {
                    setNotFound(true);
                } else {
                    setLoadFailed(true);
                    showToast(
                        "Não foi possível carregar esta seleção.",
                        "error"
                    );
                }
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        };

        void loadSelection();

        return () => {
            isActive = false;
        };
    }, [selectionId, showToast]);

    useEffect(() => {
        return () => {
            if (previewTimerRef.current) {
                clearTimeout(previewTimerRef.current);
            }
        };
    }, []);

    const openPreview = (photo: ClientSelectionPhoto) => {
        if (!photo.preview || previewTimerRef.current) return;

        setPreviewFailed(false);
        setClosingPreview(false);
        setPreviewPhoto(photo);
    };

    const closePreview = useCallback(() => {
        if (!previewPhoto || previewTimerRef.current) return;

        setClosingPreview(true);
        previewTimerRef.current = setTimeout(() => {
            setPreviewPhoto(null);
            setClosingPreview(false);
            setPreviewFailed(false);
            previewTimerRef.current = null;
        }, LIGHTBOX_ANIMATION_MS);
    }, [previewPhoto]);

    useEffect(() => {
        if (!previewPhoto) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [previewPhoto]);

    useEffect(() => {
        if (!previewPhoto) return;

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                closePreview();
            }
        };

        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [closePreview, previewPhoto]);

    const renderUnavailableState = (
        title: string,
        description: string
    ) => (
        <section className="client-selection-details__state">
            <div className="client-selection-details__state-icon">
                <Images size={30} aria-hidden="true" />
            </div>
            <h1>{title}</h1>
            <p>{description}</p>
            <Link to="/cliente/selecoes">
                <ArrowLeft size={17} aria-hidden="true" />
                Voltar às seleções
            </Link>
        </section>
    );

    return (
        <main className="client-selection-details">
            <ClientHeader />

            <div className="client-selection-details__container">
                {loading ? (
                    <>
                        <div
                            className="client-selection-details__back client-selection-details__back--skeleton"
                            aria-hidden="true"
                        />
                        <header
                            className="client-selection-details__intro client-selection-details__intro--loading"
                            aria-label="Carregando seleção"
                        >
                            <span />
                            <span />
                            <span />
                            <span />
                        </header>
                        <div className="client-selection-details__gallery client-selection-details__gallery--loading">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                                <div key={item} aria-hidden="true" />
                            ))}
                        </div>
                    </>
                ) : notFound ? (
                    renderUnavailableState(
                        "Seleção não encontrada",
                        "Não foi possível encontrar esta seleção."
                    )
                ) : loadFailed || !selection ? (
                    renderUnavailableState(
                        "Não foi possível carregar",
                        "Tente acessar esta seleção novamente em alguns instantes."
                    )
                ) : (
                    <>
                        <Link
                            to="/cliente/selecoes"
                            className="client-selection-details__back"
                        >
                            <ArrowLeft size={17} aria-hidden="true" />
                            Voltar às seleções
                        </Link>

                        <header className="client-selection-details__intro">
                            <div className="client-selection-details__eyebrow">
                                <span />
                                <p>ÁREA DO CLIENTE</p>
                            </div>

                            <h1>{selection.selectionName}</h1>
                            <p className="client-selection-details__album">
                                {selection.albumName}
                            </p>

                            <div className="client-selection-details__person">
                                <span>
                                    <UserRound size={17} aria-hidden="true" />
                                    <span>
                                        <strong>Pessoa:</strong>{" "}
                                        {selection.personName
                                            || "Não informada"}
                                    </span>
                                </span>
                                <span>
                                    <Mail size={17} aria-hidden="true" />
                                    <span>
                                        <strong>E-mail:</strong>{" "}
                                        {selection.email
                                            || "Não informado"}
                                    </span>
                                </span>
                            </div>

                            <div className="client-selection-details__meta">
                                <span>
                                    <Images size={17} aria-hidden="true" />
                                    {selection.totalPhotos}{" "}
                                    {selection.totalPhotos === 1
                                        ? "foto"
                                        : "fotos"}
                                </span>
                                <span>
                                    <CalendarDays size={17} aria-hidden="true" />
                                    {formatDate(selection.createdAt)}
                                </span>
                            </div>
                        </header>

                        <section className="client-selection-details__photos">
                            <div className="client-selection-details__section-label">
                                <span />
                                <p>FOTOS ESCOLHIDAS</p>
                            </div>

                            {selection.photos.length > 0 ? (
                                <div className="client-selection-details__gallery">
                                    {selection.photos.map((photo, index) => (
                                        <SelectionPhotoCard
                                            key={`${photo.name}-${index}`}
                                            photo={photo}
                                            onOpen={openPreview}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="client-selection-details__photos-empty">
                                    <Image size={30} aria-hidden="true" />
                                    <h2>Nenhuma foto disponível</h2>
                                    <p>
                                        Esta seleção não possui fotos para
                                        visualização.
                                    </p>
                                </div>
                            )}
                        </section>
                    </>
                )}
            </div>

            {previewPhoto && (
                <div
                    className={`client-selection-lightbox${closingPreview ? " client-selection-lightbox--closing" : ""}`}
                    onClick={closePreview}
                    role="presentation"
                >
                    <button
                        type="button"
                        className="client-selection-lightbox__close"
                        onClick={(event) => {
                            event.stopPropagation();
                            closePreview();
                        }}
                        aria-label="Fechar visualização"
                    >
                        <X size={24} aria-hidden="true" />
                    </button>

                    <div
                        className="client-selection-lightbox__content"
                        onClick={(event) => event.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-label={previewPhoto.name || "Foto selecionada"}
                    >
                        {!previewFailed ? (
                            <img
                                src={previewPhoto.preview}
                                alt={previewPhoto.name || "Foto selecionada"}
                                onError={() => setPreviewFailed(true)}
                            />
                        ) : (
                            <div className="client-selection-lightbox__fallback">
                                <Image size={38} aria-hidden="true" />
                                <span>Imagem indisponível</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
}

export default ClientSelectionDetails;
