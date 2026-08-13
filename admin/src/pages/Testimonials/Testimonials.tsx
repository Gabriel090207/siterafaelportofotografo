import "./Testimonials.css";

import {
    useEffect,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import {
    MessageSquareQuote,
    Pencil,
    Plus,
    Trash2,
} from "lucide-react";

import {
    subscribeTestimonials,
    deleteTestimonial,
} from "../../services/firebase/testimonials";

import type {
    Testimonial,
} from "../../services/firebase/testimonials";

import DeleteConfirmModal from "../../components/DeleteConfirmModal/DeleteConfirmModal";

import {
    deleteFile,
} from "../../services/firebase/storageService";

import {
    useToast,
} from "../../contexts/ToastContext";

import {
    getErrorMessage,
} from "../../utils/errorMessage";

const Testimonials = () => {

    const { showToast } = useToast();

    const navigate = useNavigate();

    const [testimonials, setTestimonials] =
        useState<Testimonial[]>([]);

    const [loading, setLoading] =
        useState(true);

    
    const [showDeleteModal, setShowDeleteModal] =
        useState(false);

    const [testimonialToDelete, setTestimonialToDelete] =
        useState<Testimonial | null>(null);

    /* =========================
       CARREGAR DEPOIMENTOS
    ========================= */

    useEffect(() => {

        const unsubscribe =
            subscribeTestimonials(
                (data) => {

                    setTestimonials(data);

                    setLoading(false);

                }
            );


        return unsubscribe;

    }, []);


    /* =========================
       FORMATAR DATA
    ========================= */

    const formatDate = (
        createdAt: any
    ) => {

        if (!createdAt) {

            return "Sem data";

        }


        try {

            const date =
                typeof createdAt.toDate === "function"
                    ? createdAt.toDate()
                    : new Date(createdAt);


            return date.toLocaleDateString(
                "pt-BR",
                {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                }
            );

        } catch {

            return "Sem data";

        }

    };


const handleDeleteTestimonial = async () => {

    if (
        !testimonialToDelete ||
        !testimonialToDelete.id
    ) {
        return;
    }


    try {

        /* =========================
           EXCLUIR FOTO DO STORAGE
        ========================= */

        if (
            testimonialToDelete
                .photoStoragePath
        ) {

            await deleteFile(
                testimonialToDelete
                    .photoStoragePath
            );

        }


        /* =========================
           EXCLUIR DO FIRESTORE
        ========================= */

        await deleteTestimonial(
            testimonialToDelete.id
        );


        /* =========================
           SUCESSO
        ========================= */

        showToast(
            "Depoimento removido com sucesso!",
            "success"
        );


    } catch (error) {

        console.error(
            "Erro ao excluir depoimento:",
            error
        );


        showToast(
            getErrorMessage(error),
            "error"
        );


    } finally {

        setShowDeleteModal(false);

        setTestimonialToDelete(null);

    }

};


    return (

        <section className="admin-testimonials-page">


            {/* =========================
                HEADER
            ========================= */}

            <div className="admin-testimonials-page__header">

                <div>

                    <h2>
                        Depoimentos
                    </h2>

                    <p>
                        Gerencie os depoimentos enviados
                        pelos clientes e exibidos no site.
                    </p>

                </div>


                <button
                    type="button"
                    className="admin-testimonials-page__new"
                    onClick={() =>
                        navigate("/testimonials/new")
                    }
                >
                    <Plus size={18} />

                    Novo Depoimento
                </button>

            </div>


            {/* =========================
                CARREGANDO
            ========================= */}

            {loading && (

                <div className="admin-testimonials-page__empty">

                    <div className="admin-testimonials-page__empty-icon">

                        <MessageSquareQuote size={28} />

                    </div>

                    <h3>
                        Carregando depoimentos...
                    </h3>

                </div>

            )}


            {/* =========================
                LISTA VAZIA
            ========================= */}

            {!loading &&
                testimonials.length === 0 && (

                <div className="admin-testimonials-page__empty">

                    <div className="admin-testimonials-page__empty-icon">

                        <MessageSquareQuote size={28} />

                    </div>

                    <h3>
                        Nenhum depoimento cadastrado
                    </h3>

                    <p>
                        Os depoimentos enviados pelos
                        clientes aparecerão aqui.
                    </p>

                </div>

            )}


            {/* =========================
                LISTA DE DEPOIMENTOS
            ========================= */}

            {!loading &&
                testimonials.length > 0 && (

                <div className="admin-testimonials-list">

                    {testimonials.map(
                        (testimonial) => (

                            <article
                                key={testimonial.id}
                                className="admin-testimonial-item"
                            >


                                {/* FOTO */}

                                <div className="admin-testimonial-item__photo">

                                    {testimonial.photoUrl ? (

                                        <img
                                            src={testimonial.photoUrl}
                                            alt={testimonial.name}
                                        />

                                    ) : (

                                        <MessageSquareQuote
                                            size={24}
                                        />

                                    )}

                                </div>


                                {/* CONTEÚDO */}

                                <div className="admin-testimonial-item__content">


                                    {/* TOPO */}

                                    <div className="admin-testimonial-item__top">

                                        <div className="admin-testimonial-item__client">

                                            <h3>
                                                {testimonial.name}
                                            </h3>

                                            <span>
                                                {testimonial.email}
                                            </span>

                                        </div>

                                    </div>


                                    {/* DEPOIMENTO */}

                                    <p className="admin-testimonial-item__message">

                                        {testimonial.message}

                                    </p>


                                    {/* RODAPÉ */}

                                    <div className="admin-testimonial-item__footer">

                                        <div className="admin-testimonial-item__footer-info">

                                            <span
                                                className={
                                                    testimonial.status === "active"
                                                        ? "admin-testimonial-item__status admin-testimonial-item__status--active"
                                                        : "admin-testimonial-item__status admin-testimonial-item__status--hidden"
                                                }
                                            >

                                                {testimonial.status === "active"
                                                    ? "Publicado"
                                                    : "Oculto"}

                                            </span>

                                            <span className="admin-testimonial-item__date">

                                                {formatDate(
                                                    testimonial.createdAt
                                                )}

                                            </span>

                                        </div>


                                        <div className="admin-testimonial-item__actions">

                                            <button
                                                type="button"
                                                title="Editar depoimento"
                                                onClick={() =>
                                                    navigate(
                                                        `/testimonials/${testimonial.id}/edit`
                                                    )
                                                }
                                            >

                                                <Pencil size={18} />

                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {

                                                    setTestimonialToDelete(
                                                        testimonial
                                                    );

                                                    setShowDeleteModal(
                                                        true
                                                    );

                                                }}
                                                aria-label="Excluir depoimento"
                                            >
                                                <Trash2 size={18} />
                                            </button>

                                        </div>

                                    </div>


                                </div>


                            </article>

                        )
                    )}

                </div>

            )}


            <DeleteConfirmModal
                open={showDeleteModal}

                title="Excluir depoimento"

                message={
                    `Deseja realmente excluir o depoimento de "${testimonialToDelete?.name}"? Esta ação removerá o depoimento e a foto armazenada.`
                }

                onCancel={() => {

                    setShowDeleteModal(false);

                    setTestimonialToDelete(null);

                }}

                onConfirm={
                    handleDeleteTestimonial
                }
            />


        </section>

    );

};

export default Testimonials;