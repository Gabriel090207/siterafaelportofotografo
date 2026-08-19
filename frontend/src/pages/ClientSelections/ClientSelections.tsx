import "./ClientSelections.css";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowRight,
    CalendarDays,
    Images,
    Mail,
    UserRound,
} from "lucide-react";

import ClientHeader from "../../components/ClientHeader/ClientHeader";
import { useToast } from "../../contexts/ToastContext";
import {
    getClientSelections,
    type ClientSelectionSummary,
} from "../../services/api/clientSelections";

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

function SelectionCover({ selection }: { selection: ClientSelectionSummary }) {
    const [failed, setFailed] = useState(false);
    const showImage = Boolean(selection.preview) && !failed;

    return (
        <div className="client-selection-card__cover">
            {showImage ? (
                <img
                    src={selection.preview ?? ""}
                    alt={`Capa da seleção ${selection.selectionName}`}
                    loading="lazy"
                    decoding="async"
                    onError={() => setFailed(true)}
                />
            ) : (
                <div className="client-selection-card__cover-fallback">
                    <Images size={34} aria-hidden="true" />
                    <span>Sem imagem</span>
                </div>
            )}
        </div>
    );
}

function ClientSelections() {
    const { showToast } = useToast();
    const [selections, setSelections] = useState<ClientSelectionSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadFailed, setLoadFailed] = useState(false);

    useEffect(() => {
        let isActive = true;

        const loadSelections = async () => {
            try {
                const data = await getClientSelections();

                if (isActive) {
                    setSelections(data);
                }
            } catch (error) {
                console.error("Erro ao carregar seleções:", error);

                if (isActive) {
                    setLoadFailed(true);
                    showToast(
                        "Não foi possível carregar suas seleções.",
                        "error"
                    );
                }
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        };

        void loadSelections();

        return () => {
            isActive = false;
        };
    }, [showToast]);

    return (
        <main className="client-selections">
            <ClientHeader />

            <div className="client-selections__container">
                <header className="client-selections__intro">
                    <div className="client-selections__eyebrow">
                        <span />
                        <p>ÁREA DO CLIENTE</p>
                    </div>

                    <h1>Suas seleções</h1>
                    <p className="client-selections__description">
                        Consulte as escolhas que você enviou em cada álbum.
                    </p>
                </header>

                {loading ? (
                    <section
                        className="client-selections__grid"
                        aria-label="Carregando seleções"
                    >
                        {[1, 2, 3].map((item) => (
                            <article
                                key={item}
                                className="client-selection-card client-selection-card--loading"
                                aria-hidden="true"
                            >
                                <div className="client-selection-card__skeleton-cover" />
                                <div className="client-selection-card__skeleton-content">
                                    <span className="client-selection-card__skeleton-title" />
                                    <span className="client-selection-card__skeleton-album" />
                                    <span className="client-selection-card__skeleton-client" />
                                    <span className="client-selection-card__skeleton-meta" />
                                    <span className="client-selection-card__skeleton-button" />
                                </div>
                            </article>
                        ))}
                    </section>
                ) : loadFailed ? (
                    <section className="client-selections__empty">
                        <div className="client-selections__empty-icon">
                            <Images size={30} aria-hidden="true" />
                        </div>
                        <h2>Não foi possível carregar</h2>
                        <p>
                            Tente acessar novamente em alguns instantes.
                        </p>
                    </section>
                ) : selections.length === 0 ? (
                    <section className="client-selections__empty">
                        <div className="client-selections__empty-icon">
                            <Images size={30} aria-hidden="true" />
                        </div>
                        <h2>Nenhuma seleção criada</h2>
                        <p>
                            As seleções que você criar nos seus álbuns
                            aparecerão aqui.
                        </p>
                        <Link to="/cliente/dashboard">
                            Ver meus álbuns
                            <ArrowRight size={17} aria-hidden="true" />
                        </Link>
                    </section>
                ) : (
                    <section
                        className="client-selections__grid"
                        aria-label="Suas seleções"
                    >
                        {selections.map((selection) => (
                            <article
                                key={selection.id}
                                className="client-selection-card"
                            >
                                <SelectionCover selection={selection} />

                                <div className="client-selection-card__content">
                                    <h2>{selection.selectionName}</h2>
                                    <p className="client-selection-card__album">
                                        {selection.albumName}
                                    </p>

                                    <div className="client-selection-card__person">
                                        <span>
                                            <UserRound size={16} aria-hidden="true" />
                                            <span>
                                                <strong>Pessoa:</strong>{" "}
                                                {selection.personName
                                                    || "Não informada"}
                                            </span>
                                        </span>
                                        <span>
                                            <Mail size={16} aria-hidden="true" />
                                            <span>
                                                <strong>E-mail:</strong>{" "}
                                                {selection.email
                                                    || "Não informado"}
                                            </span>
                                        </span>
                                    </div>

                                    <div className="client-selection-card__meta">
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

                                    <Link
                                        to={`/cliente/selecoes/${selection.id}`}
                                        className="client-selection-card__link"
                                    >
                                        <span>Ver detalhes</span>
                                        <ArrowRight size={18} aria-hidden="true" />
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </section>
                )}
            </div>
        </main>
    );
}

export default ClientSelections;
