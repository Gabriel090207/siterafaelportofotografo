import "./ClientTestimonials.css";

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
    MessageSquareQuote,
    Pencil,
    Send,
    Trash2,
    X,
} from "lucide-react";

import ClientHeader from "../../components/ClientHeader/ClientHeader";
import DeleteConfirmModal from "../../components/DeleteConfirmModal/DeleteConfirmModal";
import { useToast } from "../../contexts/ToastContext";
import {
    deleteClientTestimonial,
    getClientTestimonials,
    updateClientTestimonial,
    type ClientTestimonial,
} from "../../services/api/clientTestimonials";

const MODAL_ANIMATION_MS = 350;

type ModalState =
    | { type: "edit"; testimonial: ClientTestimonial }
    | { type: "delete"; testimonial: ClientTestimonial }
    | null;

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

function ClientTestimonials() {
    const { showToast } = useToast();
    const [testimonials, setTestimonials] = useState<ClientTestimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<ModalState>(null);
    const [closingModal, setClosingModal] = useState(false);
    const [name, setName] = useState("");
    const [message, setMessage] = useState("");
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const modalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const operationInProgress = saving || deleting;

    useEffect(() => {
        let isActive = true;

        const loadTestimonials = async () => {
            try {
                const data = await getClientTestimonials();

                if (isActive) {
                    setTestimonials(data);
                }
            } catch (error) {
                console.error("Erro ao carregar depoimentos:", error);

                if (isActive) {
                    showToast(
                        "Não foi possível carregar seus depoimentos.",
                        "error"
                    );
                }
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        };

        void loadTestimonials();

        return () => {
            isActive = false;
        };
    }, [showToast]);

    useEffect(() => {
        return () => {
            if (modalTimerRef.current) {
                clearTimeout(modalTimerRef.current);
            }
        };
    }, []);

    const openEditModal = (testimonial: ClientTestimonial) => {
        setName(testimonial.name);
        setMessage(testimonial.message);
        setClosingModal(false);
        setModal({ type: "edit", testimonial });
    };

    const openDeleteModal = (testimonial: ClientTestimonial) => {
        setClosingModal(false);
        setModal({ type: "delete", testimonial });
    };

    const closeModal = useCallback((force = false) => {
        if (!modal || modalTimerRef.current) return Promise.resolve();
        if (operationInProgress && !force) return Promise.resolve();

        setClosingModal(true);

        return new Promise<void>((resolve) => {
            modalTimerRef.current = setTimeout(() => {
                setModal(null);
                setClosingModal(false);
                modalTimerRef.current = null;
                resolve();
            }, MODAL_ANIMATION_MS);
        });
    }, [modal, operationInProgress]);

    useEffect(() => {
        if (!modal || modal.type !== "edit") return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [modal]);

    useEffect(() => {
        if (!modal || modal.type !== "edit") return;

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !operationInProgress) {
                void closeModal();
            }
        };

        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [closeModal, modal, operationInProgress]);

    const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!modal || modal.type !== "edit" || saving) return;

        const trimmedName = name.trim();
        const trimmedMessage = message.trim();

        if (!trimmedName || !trimmedMessage) {
            showToast("Preencha o nome e o depoimento.", "warning");
            return;
        }

        try {
            setSaving(true);

            const updated = await updateClientTestimonial(
                modal.testimonial.id,
                {
                    name: trimmedName,
                    message: trimmedMessage,
                }
            );

            setTestimonials((current) =>
                current.map((testimonial) =>
                    testimonial.id === updated.id ? updated : testimonial
                )
            );

            showToast("Depoimento atualizado com sucesso!", "success");
            await closeModal(true);
        } catch (error) {
            console.error("Erro ao atualizar depoimento:", error);
            showToast("Não foi possível atualizar o depoimento.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!modal || modal.type !== "delete" || deleting) return;

        const testimonialId = modal.testimonial.id;

        try {
            setDeleting(true);
            await deleteClientTestimonial(testimonialId);

            setTestimonials((current) =>
                current.filter((testimonial) => testimonial.id !== testimonialId)
            );

            showToast("Depoimento excluído com sucesso!", "success");
            setModal(null);
        } catch (error) {
            console.error("Erro ao excluir depoimento:", error);
            showToast("Não foi possível excluir o depoimento.", "error");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <main className="client-testimonials">
            <ClientHeader />

            <div className="client-testimonials__container">
                <header className="client-testimonials__intro">
                    <div className="client-testimonials__eyebrow">
                        <span />
                        <p>ÁREA DO CLIENTE</p>
                    </div>

                    <h1>Seus depoimentos</h1>
                    <p className="client-testimonials__description">
                        Consulte os depoimentos que você enviou e faça
                        alterações quando precisar.
                    </p>
                </header>

                {loading ? (
                    <section
                        className="client-testimonials__list"
                        aria-label="Carregando depoimentos"
                    >
                        {[1, 2].map((item) => (
                            <article
                                key={item}
                                className="client-testimonial-card client-testimonial-card--loading"
                                aria-hidden="true"
                            >
                                <div className="client-testimonial-card__skeleton-photo" />
                                <div className="client-testimonial-card__skeleton-content">
                                    <div className="client-testimonial-card__skeleton-heading" />
                                    <div className="client-testimonial-card__skeleton-message" />
                                    <div className="client-testimonial-card__skeleton-message client-testimonial-card__skeleton-message--short" />
                                    <div className="client-testimonial-card__skeleton-footer">
                                        <div className="client-testimonial-card__skeleton-meta" />
                                        <div className="client-testimonial-card__skeleton-actions" />
                                    </div>
                                </div>
                            </article>
                        ))}
                    </section>
                ) : testimonials.length === 0 ? (
                    <section className="client-testimonials__empty">
                        <div className="client-testimonials__empty-icon">
                            <MessageSquareQuote size={30} aria-hidden="true" />
                        </div>
                        <h2>Nenhum depoimento enviado</h2>
                        <p>
                            Quando você enviar um depoimento pelo site, ele
                            aparecerá aqui.
                        </p>
                        <Link to="/depoimentos">
                            Enviar depoimento
                            <Send size={17} aria-hidden="true" />
                        </Link>
                    </section>
                ) : (
                    <section
                        className="client-testimonials__list"
                        aria-label="Seus depoimentos"
                    >
                        {testimonials.map((testimonial) => (
                            <article
                                key={testimonial.id}
                                className="client-testimonial-card"
                            >
                                <div className="client-testimonial-card__photo">
                                    {testimonial.photoUrl ? (
                                        <img
                                            src={testimonial.photoUrl}
                                            alt={testimonial.name}
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    ) : (
                                        <MessageSquareQuote size={25} aria-hidden="true" />
                                    )}
                                </div>

                                <div className="client-testimonial-card__content">
                                    <div className="client-testimonial-card__top">
                                        <div className="client-testimonial-card__identity">
                                            <h2>{testimonial.name}</h2>
                                        </div>
                                    </div>

                                    <p className="client-testimonial-card__message">
                                        {testimonial.message}
                                    </p>

                                    <div className="client-testimonial-card__footer">
                                        <div className="client-testimonial-card__footer-info">
                                            <span
                                                className={`client-testimonial-card__status client-testimonial-card__status--${testimonial.status}`}
                                            >
                                                {testimonial.status === "active"
                                                    ? "Publicado"
                                                    : "Oculto"}
                                            </span>

                                            <time
                                                className="client-testimonial-card__date"
                                                dateTime={testimonial.createdAt ?? undefined}
                                            >
                                                {formatDate(testimonial.createdAt)}
                                            </time>
                                        </div>

                                        <div className="client-testimonial-card__actions">
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(testimonial)}
                                                aria-label={`Editar depoimento de ${testimonial.name}`}
                                                title="Editar depoimento"
                                            >
                                                <Pencil size={18} aria-hidden="true" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => openDeleteModal(testimonial)}
                                                aria-label={`Excluir depoimento de ${testimonial.name}`}
                                                title="Excluir depoimento"
                                            >
                                                <Trash2 size={18} aria-hidden="true" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </section>
                )}
            </div>

            {modal?.type === "edit" && (
                <div
                    className={`client-testimonials-modal${closingModal ? " client-testimonials-modal--closing" : ""}`}
                    onClick={() => void closeModal()}
                    role="presentation"
                >
                    <div
                        className="client-testimonials-modal__content"
                        onClick={(event) => event.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="client-testimonials-modal-title"
                    >
                        <button
                            type="button"
                            className="client-testimonials-modal__close"
                            onClick={() => void closeModal()}
                            disabled={operationInProgress}
                            aria-label="Fechar"
                        >
                            <X size={20} aria-hidden="true" />
                        </button>

                        <form onSubmit={handleUpdate}>
                            <div className="client-testimonials-modal__eyebrow">
                                EDITAR DEPOIMENTO
                            </div>
                            <h2 id="client-testimonials-modal-title">
                                Atualize sua experiência
                            </h2>

                            <div className="client-testimonials-modal__field">
                                <label htmlFor="client-testimonial-name">Nome</label>
                                <input
                                    id="client-testimonial-name"
                                    type="text"
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    maxLength={80}
                                    disabled={saving}
                                />
                            </div>

                            <div className="client-testimonials-modal__field">
                                <label htmlFor="client-testimonial-message">
                                    Depoimento
                                </label>
                                <textarea
                                    id="client-testimonial-message"
                                    value={message}
                                    onChange={(event) => setMessage(event.target.value)}
                                    maxLength={1000}
                                    rows={7}
                                    disabled={saving}
                                />
                                <span>{message.length}/1000</span>
                            </div>

                            <button
                                type="submit"
                                className="client-testimonials-modal__primary"
                                disabled={saving}
                            >
                                {saving ? "Salvando..." : "Salvar alterações"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <DeleteConfirmModal
                open={modal?.type === "delete"}
                title="Excluir depoimento"
                message={
                    modal?.type === "delete"
                        ? `Deseja realmente excluir o depoimento de "${modal.testimonial.name}"? Esta ação removerá o depoimento e a foto armazenada.`
                        : undefined
                }
                onCancel={() => setModal(null)}
                onConfirm={handleDelete}
            />
        </main>
    );
}

export default ClientTestimonials;
