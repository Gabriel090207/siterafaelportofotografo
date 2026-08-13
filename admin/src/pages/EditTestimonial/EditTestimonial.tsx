import "./EditTestimonial.css";

import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    ArrowLeft,
    Camera,
    Save,
} from "lucide-react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    getTestimonialById,
    updateTestimonial,
} from "../../services/firebase/testimonials";

import {
    useToast,
} from "../../contexts/ToastContext";

import {
    getErrorMessage,
} from "../../utils/errorMessage";

import {
    uploadTestimonialPhoto,
    deleteFile,
} from "../../services/firebase/storageService";

import LoadingModal from "../../components/LoadingModal/LoadingModal";

const EditTestimonial = () => {

    const navigate =
        useNavigate();

    const { id } =
        useParams();

    const { showToast } =
        useToast();

    const fileInputRef =
        useRef<HTMLInputElement | null>(null);


    /* =========================
       ESTADOS
    ========================= */

    const [name, setName] =
        useState("");

    const [email, setEmail] =
        useState("");

    const [message, setMessage] =
        useState("");

    const [status, setStatus] =
        useState<"active" | "hidden">(
            "active"
        );


    /* =========================
       FOTO ATUAL
    ========================= */

    const [currentPhotoUrl, setCurrentPhotoUrl] =
        useState("");

    const [
        currentPhotoStoragePath,
        setCurrentPhotoStoragePath,
    ] = useState("");


    /* =========================
       NOVA FOTO
    ========================= */

    const [photo, setPhoto] =
        useState<File | null>(null);

    const [photoPreview, setPhotoPreview] =
        useState<string | null>(null);


    /* =========================
       CONTROLE
    ========================= */

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);


    const [loadingModal, setLoadingModal] =
        useState({
            open: false,
            success: false,
            progress: 0,
            title: "Atualizando depoimento",
            message: "Preparando...",
        });


    /* =========================
       CARREGAR DEPOIMENTO
    ========================= */

    useEffect(() => {

        if (!id) {

            navigate(
                "/testimonials"
            );

            return;

        }


        const loadTestimonial =
            async () => {

                try {

                    setLoading(true);


                    const testimonial =
                        await getTestimonialById(
                            id
                        );


                    if (!testimonial) {

                        showToast(
                            "Depoimento não encontrado.",
                            "error"
                        );

                        navigate(
                            "/testimonials"
                        );

                        return;

                    }


                    setName(
                        testimonial.name ?? ""
                    );

                    setEmail(
                        testimonial.email ?? ""
                    );

                    setMessage(
                        testimonial.message ?? ""
                    );

                    setStatus(
                        testimonial.status ??
                            "active"
                    );


                    setCurrentPhotoUrl(
                        testimonial.photoUrl ?? ""
                    );

                    setCurrentPhotoStoragePath(
                        testimonial.photoStoragePath ??
                            ""
                    );


                } catch (error) {

                    console.error(
                        "Erro ao carregar depoimento:",
                        error
                    );


                    showToast(
                        getErrorMessage(error),
                        "error"
                    );


                    navigate(
                        "/testimonials"
                    );


                } finally {

                    setLoading(false);

                }

            };


        loadTestimonial();


    }, [
        id,
        navigate,
        showToast,
    ]);


    /* =========================
       SELECIONAR NOVA FOTO
    ========================= */

    const handlePhotoChange = (
        event:
            React.ChangeEvent<HTMLInputElement>
    ) => {

        const file =
            event.target.files?.[0];


        if (!file) {
            return;
        }


        setPhoto(
            file
        );


        const preview =
            URL.createObjectURL(
                file
            );


        setPhotoPreview(
            preview
        );

    };

    const validateTestimonial = () => {

        if (!name.trim()) {

            showToast(
                "Informe o nome do cliente.",
                "warning"
            );

            return false;
        }


       if (email.trim()) {

            const emailRegex =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


            if (!emailRegex.test(email.trim())) {

                showToast(
                    "Informe um e-mail válido.",
                    "warning"
                );

                return false;
            }

        }

        if (!message.trim()) {

            showToast(
                "Informe o depoimento.",
                "warning"
            );

            return false;
        }


        return true;
    };


    /* =========================
       SALVAR
       FAREMOS NO PRÓXIMO PASSO
    ========================= */

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {

        event.preventDefault();


        if (saving || !id) {
            return;
        }


        if (!validateTestimonial()) {
            return;
        }


        try {

            setSaving(true);


            setLoadingModal({
                open: true,
                success: false,
                progress: 15,
                title: "Atualizando depoimento",
                message: "Preparando alterações...",
            });


            /* =========================
            DADOS ATUAIS DA FOTO
            ========================= */

            let photoUrl =
                currentPhotoUrl;

            let photoStoragePath =
                currentPhotoStoragePath;


            /* =========================
            TROCOU A FOTO
            ========================= */

            if (photo) {

                setLoadingModal((current) => ({
                    ...current,
                    progress: 30,
                    message: "Enviando nova foto...",
                }));


                const uploadedPhoto =
                    await uploadTestimonialPhoto(
                        photo
                    );


                photoUrl =
                    uploadedPhoto.url;

                photoStoragePath =
                    uploadedPhoto.storagePath;


                setLoadingModal((current) => ({
                    ...current,
                    progress: 65,
                    message: "Nova foto enviada. Atualizando depoimento...",
                }));

            } else {

                setLoadingModal((current) => ({
                    ...current,
                    progress: 60,
                    message: "Atualizando depoimento...",
                }));

            }


            /* =========================
            ATUALIZAR FIRESTORE
            ========================= */

            await updateTestimonial(
                id,
                {
                    name:
                        name.trim(),

                    email:
                        email
                            .trim()
                            .toLowerCase(),

                    message:
                        message.trim(),

                    status,

                    photoUrl,

                    photoStoragePath,
                }
            );


            /* =========================
            REMOVER FOTO ANTIGA
            ========================= */

            if (
                photo &&
                currentPhotoStoragePath &&
                currentPhotoStoragePath !==
                    photoStoragePath
            ) {

                setLoadingModal((current) => ({
                    ...current,
                    progress: 85,
                    message: "Finalizando atualização...",
                }));


                try {

                    await deleteFile(
                        currentPhotoStoragePath
                    );

                } catch (deleteError) {

                    /*
                    * O depoimento já foi atualizado.
                    * Uma falha ao limpar a foto antiga
                    * não deve transformar a edição
                    * inteira em erro.
                    */

                    console.error(
                        "Erro ao remover foto antiga:",
                        deleteError
                    );

                }

            }


            /* =========================
            SUCESSO
            ========================= */

            setLoadingModal((current) => ({
                ...current,
                success: true,
                progress: 100,
                message:
                    "Depoimento atualizado com sucesso!",
            }));


            showToast(
                "Depoimento atualizado com sucesso!",
                "success"
            );


            navigate(
                "/testimonials"
            );


        } catch (error) {

            setLoadingModal((current) => ({
                ...current,
                open: false,
            }));


            console.error(
                "Erro ao atualizar depoimento:",
                error
            );


            showToast(
                getErrorMessage(error),
                "error"
            );


        } finally {

            setSaving(false);

        }

    };


    /* =========================
       CARREGANDO
    ========================= */

    if (loading) {

        return (

            <section className="edit-testimonial-page">

                <div className="edit-testimonial-page__loading">

                    Carregando depoimento...

                </div>

            </section>

        );

    }


    return (

        <section className="edit-testimonial-page">


            {/* =========================
                HEADER
            ========================= */}

            <div className="edit-testimonial-page__header">

                <button
                    type="button"
                    className="edit-testimonial-page__back"
                    onClick={() =>
                        navigate(
                            "/testimonials"
                        )
                    }
                >

                    <ArrowLeft size={18} />

                    <span>
                        Voltar
                    </span>

                </button>


                <div>

                    <h2>
                        Editar Depoimento
                    </h2>

                    <p>
                        Atualize as informações do depoimento selecionado.
                    </p>

                </div>

            </div>


            {/* =========================
                FORMULÁRIO
            ========================= */}

            <form
                className="edit-testimonial-form"
                onSubmit={handleSubmit}
            >


                {/* =========================
                    FOTO
                ========================= */}

                <div className="edit-testimonial-form__section">

                    <div className="edit-testimonial-form__section-header">

                        <h3>
                            Foto do Cliente
                        </h3>

                        <p>
                            Mantenha a foto atual ou escolha uma nova imagem.
                        </p>

                    </div>


                    <div className="edit-testimonial-form__photo-area">

                        <button
                            type="button"
                            className="edit-testimonial-form__photo"
                            onClick={() =>
                                fileInputRef.current?.click()
                            }
                            aria-label="Alterar foto de perfil"
                        >

                            {photoPreview ? (

                                <img
                                    src={photoPreview}
                                    alt={`Nova foto de ${name}`}
                                />

                            ) : currentPhotoUrl ? (

                                <img
                                    src={currentPhotoUrl}
                                    alt={`Foto de ${name}`}
                                />

                            ) : (

                                <Camera size={38} />

                            )}

                        </button>


                        <div className="edit-testimonial-form__photo-info">

                            <strong>

                                {photo
                                    ? "Nova foto selecionada"
                                    : "Foto atual"}

                            </strong>

                            <p>

                                {photo
                                    ? "A nova imagem substituirá a foto atual ao salvar."
                                    : "Clique na foto para escolher uma nova imagem."}

                            </p>

                            {photo && (

                                <span>
                                    {photo.name}
                                </span>

                            )}

                        </div>


                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handlePhotoChange}
                            hidden
                        />

                    </div>

                </div>


                {/* =========================
                    INFORMAÇÕES
                ========================= */}

                <div className="edit-testimonial-form__section">

                    <div className="edit-testimonial-form__section-header">

                        <h3>
                            Informações do Cliente
                        </h3>

                        <p>
                            Atualize os dados da pessoa que enviou o depoimento.
                        </p>

                    </div>


                    <div className="edit-testimonial-form__grid">


                        <div className="edit-testimonial-form__field">

                            <label htmlFor="edit-testimonial-name">
                                Nome
                            </label>

                            <input
                                id="edit-testimonial-name"
                                type="text"
                                placeholder="Nome do cliente"
                                value={name}
                                onChange={(event) =>
                                    setName(
                                        event.target.value
                                    )
                                }
                            
                            />

                        </div>


                        <div className="edit-testimonial-form__field">

                            <label htmlFor="edit-testimonial-email">
                                E-mail (opcional)
                            </label>

                            <input
                                id="edit-testimonial-email"
                                type="email"
                                placeholder="email@exemplo.com"
                                value={email}
                                onChange={(event) =>
                                    setEmail(
                                        event.target.value
                                    )
                                }
                             
                            />

                        </div>


                    </div>

                </div>


                {/* =========================
                    DEPOIMENTO
                ========================= */}

                <div className="edit-testimonial-form__section">

                    <div className="edit-testimonial-form__section-header">

                        <h3>
                            Depoimento
                        </h3>

                        <p>
                            Atualize o depoimento exibido no site.
                        </p>

                    </div>


                    <div className="edit-testimonial-form__field">

                        <label htmlFor="edit-testimonial-message">
                            Mensagem
                        </label>

                        <textarea
                            id="edit-testimonial-message"
                            placeholder="Digite o depoimento..."
                            value={message}
                            onChange={(event) =>
                                setMessage(
                                    event.target.value
                                )
                            }
                            rows={7}
                        
                        />

                    </div>

                </div>


                {/* =========================
                    PUBLICAÇÃO
                ========================= */}

                <div className="edit-testimonial-form__section">

                    <div className="edit-testimonial-form__section-header">

                        <h3>
                            Publicação
                        </h3>

                        <p>
                            Defina se o depoimento ficará visível no site.
                        </p>

                    </div>


                    <div className="edit-testimonial-form__field">

                        <label htmlFor="edit-testimonial-status">
                            Status
                        </label>

                        <select
                            id="edit-testimonial-status"
                            value={status}
                            onChange={(event) =>
                                setStatus(
                                    event.target.value as
                                        "active" | "hidden"
                                )
                            }
                        >

                            <option value="active">
                                Publicado
                            </option>

                            <option value="hidden">
                                Oculto
                            </option>

                        </select>

                    </div>

                </div>


                {/* =========================
                    AÇÕES
                ========================= */}

                <div className="edit-testimonial-form__actions">

                    <button
                        type="button"
                        className="edit-testimonial-form__cancel"
                        onClick={() =>
                            navigate(
                                "/testimonials"
                            )
                        }
                        disabled={saving}
                    >

                        Cancelar

                    </button>


                    <button
                        type="submit"
                        className="edit-testimonial-form__save"
                        disabled={saving}
                    >

                        <Save size={18} />

                        Salvar Alterações

                    </button>

                </div>


            </form>


            <LoadingModal
                open={loadingModal.open}
                progress={loadingModal.progress}
                title={loadingModal.title}
                message={loadingModal.message}
                success={loadingModal.success}
            />


        </section>

    );

};


export default EditTestimonial;