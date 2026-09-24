import "./Testimonials.css";

import {
    useEffect,
    useState,
    useRef,
    type ReactNode,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import {
    MessageSquareQuote,
    Pencil,
    GripVertical,
    Plus,
    Trash2,
} from "lucide-react";

import {
    subscribeTestimonials,
    deleteTestimonial,
    updateTestimonialsOrder,
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

import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    verticalListSortingStrategy,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const SortableTestimonialItem = ({ testimonial, disabled, children }: {
    testimonial: Testimonial;
    disabled: boolean;
    children: (handle: ReactNode) => ReactNode;
}) => {
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
        useSortable({ id: testimonial.id!, disabled });
    const handle = (
        <button
            type="button"
            ref={setActivatorNodeRef}
            className="admin-testimonial-item__drag-handle"
            disabled={disabled}
            {...attributes}
            {...listeners}
            aria-label="Reordenar depoimento"
            title={disabled ? "Salvando ordem" : "Reordenar depoimento"}
        >
            <GripVertical size={18} aria-hidden="true" />
        </button>
    );
    return (
        <article ref={setNodeRef}
            className={`admin-testimonial-item${isDragging ? " admin-testimonial-item--dragging" : ""}`}
            style={{ transform: CSS.Transform.toString(transform), transition }}>
            {children(handle)}
        </article>
    );
};

const Testimonials = () => {

    const { showToast } = useToast();

    const navigate = useNavigate();
    const [savingOrder, setSavingOrder] = useState(false);
    const savingOrderRef = useRef(false);
    const confirmedTestimonials = useRef<Testimonial[]>([]);
    const snapshotVersion = useRef(0);
    const dragVersion = useRef<number | null>(null);
    const subscriptionScope = useRef(0);
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 7 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

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
        const scope = ++subscriptionScope.current;
        const unsubscribe = subscribeTestimonials((data, confirmed) => {
            if (scope !== subscriptionScope.current) return;
            snapshotVersion.current += 1;
            if (confirmed) confirmedTestimonials.current = data;
            if (!savingOrderRef.current) setTestimonials(data);
            setLoading(false);
        }, (error) => {
            if (scope !== subscriptionScope.current) return;
            setLoading(false);
            showToast(getErrorMessage(error), "error");
        });
        return () => {
            unsubscribe();
            subscriptionScope.current += 1;
        };
    }, [showToast]);

    const handleDragEnd = async ({ active, over }: DragEndEvent) => {
        const startedVersion = dragVersion.current;
        dragVersion.current = null;
        if (savingOrderRef.current || !over || active.id === over.id || startedVersion === null) return;
        if (startedVersion !== snapshotVersion.current) {
            showToast("A lista mudou durante o arraste. Tente novamente.", "warning");
            return;
        }
        const oldIndex = testimonials.findIndex((item) => item.id === active.id);
        const newIndex = testimonials.findIndex((item) => item.id === over.id);
        if (oldIndex < 0 || newIndex < 0) return;
        const ordered = arrayMove(testimonials, oldIndex, newIndex);
        const scope = subscriptionScope.current;
        savingOrderRef.current = true;
        setSavingOrder(true);
        setTestimonials(ordered);
        try {
            await updateTestimonialsOrder(ordered);
            if (scope !== subscriptionScope.current) return;
            // A metadata-only confirmation may arrive just after the promise settles.
            const confirmed = confirmedTestimonials.current;
            const matchesSavedOrder = ordered.every((item, index) =>
                confirmed.some((saved) => saved.id === item.id && saved.order === index + 1));
            setTestimonials(matchesSavedOrder ? confirmed : ordered.map((item, index) => ({
                ...item, order: index + 1,
            })));
        } catch (error) {
            if (scope !== subscriptionScope.current) return;
            setTestimonials(confirmedTestimonials.current);
            showToast(getErrorMessage(error), "error");
        } finally {
            if (scope === subscriptionScope.current) {
                savingOrderRef.current = false;
                setSavingOrder(false);
            }
        }
    };

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

                <DndContext sensors={sensors} collisionDetection={closestCenter}
                    onDragStart={() => { dragVersion.current = snapshotVersion.current; }}
                    onDragCancel={() => { dragVersion.current = null; }}
                    onDragEnd={handleDragEnd}>
                <SortableContext items={testimonials.map((item) => item.id!)} strategy={verticalListSortingStrategy}>
                <div className="admin-testimonials-list" aria-busy={savingOrder}>

                    {testimonials.map(
                        (testimonial) => (

                            <SortableTestimonialItem key={testimonial.id}
                                testimonial={testimonial} disabled={savingOrder}>
                            {(dragHandle) => <>


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
                                            {dragHandle}

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


                            </>}
                            </SortableTestimonialItem>

                        )
                    )}

                </div>
                </SortableContext>
                </DndContext>

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