import "./TestimonialForm.css";

import {
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
} from "react-router-dom";

import {
    uploadTestimonialPhoto,
} from "../../services/firebase/storageService";

import {
    createTestimonial,
} from "../../services/firebase/testimonials";

import {
    useToast,
} from "../../contexts/ToastContext";

import {
    getErrorMessage,
} from "../../utils/errorMessage";

import LoadingModal from "../../components/LoadingModal/LoadingModal";

const TestimonialForm = () => {

    const { showToast } = useToast();

    const navigate = useNavigate();

    const fileInputRef =
        useRef<HTMLInputElement | null>(null);


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

    const [photo, setPhoto] =
        useState<File | null>(null);

    const [photoPreview, setPhotoPreview] =
        useState<string | null>(null);

    const [saving, setSaving] =
        useState(false);


    const [loadingModal, setLoadingModal] =
        useState({
            open: false,
            success: false,
            progress: 0,
            title: "Salvando depoimento",
            message: "Preparando...",
        });


    /* =========================
       SELECIONAR FOTO
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


        setPhoto(file);


        const preview =
            URL.createObjectURL(file);

        setPhotoPreview(preview);

    };



const validateTestimonial = () => {

    if (!photo) {

        showToast(
            "Selecione uma foto de perfil.",
            "warning"
        );

        return false;
    }


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
    ========================= */

const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
) => {

    event.preventDefault();


    if (saving) {
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
            progress: 10,
            title: "Salvando depoimento",
            message: "Preparando foto...",
        });


        /* =========================
           UPLOAD DA FOTO
        ========================= */

        const uploadedPhoto =
            await uploadTestimonialPhoto(
                photo!
            );

            setLoadingModal((current) => ({
                ...current,
                progress: 65,
                message: "Foto enviada. Salvando depoimento...",
            }));


        /* =========================
           FIRESTORE
        ========================= */

        await createTestimonial({

            name:
                name.trim(),

            email:
                email
                    .trim()
                    .toLowerCase(),

            message:
                message.trim(),

            photoUrl:
                uploadedPhoto.url,

            photoStoragePath:
                uploadedPhoto.storagePath,

            status,

        });

        setLoadingModal((current) => ({
            ...current,
            success: true,
            progress: 100,
            message: "Depoimento salvo com sucesso!",
        }));


        /* =========================
           SUCESSO
        ========================= */


        navigate(
            "/testimonials"
        );


    } catch (error) {

        setLoadingModal((current) => ({
            ...current,
            open: false,
        }));

        console.error(
            "Erro ao criar depoimento:",
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


    return (

        <section className="testimonial-form-page">


            {/* =========================
                HEADER
            ========================= */}

            <div className="testimonial-form-page__header">

                <button
                    type="button"
                    className="testimonial-form-page__back"
                    onClick={() =>
                        navigate("/testimonials")
                    }
                >
                    <ArrowLeft size={18} />

                    <span>Voltar</span>
                </button>


                <div>

                    <h2>
                        Novo Depoimento
                    </h2>

                    <p>
                        Cadastre um novo depoimento para
                        exibição no site.
                    </p>

                </div>

            </div>


            {/* =========================
                FORMULÁRIO
            ========================= */}

            <form
                className="testimonial-form"
                onSubmit={handleSubmit}
            >


                {/* =========================
                    FOTO
                ========================= */}

                <div className="testimonial-form__section">

                    <div className="testimonial-form__section-header">

                        <h3>
                            Foto do Cliente
                        </h3>

                        <p>
                            Escolha a foto de perfil que
                            será exibida junto ao depoimento.
                        </p>

                    </div>


                    <div className="testimonial-form__photo-area">

                        <button
                            type="button"
                            className="testimonial-form__photo"
                            onClick={() =>
                                fileInputRef.current?.click()
                            }
                            aria-label={
                                photoPreview
                                    ? "Alterar foto de perfil"
                                    : "Selecionar foto de perfil"
                            }
                        >

                            {photoPreview ? (

                                <img
                                    src={photoPreview}
                                    alt={`Foto de ${name || "perfil"}`}
                                />

                            ) : (

                                <Camera size={38} />

                            )}

                        </button>


                        <div className="testimonial-form__photo-info">

                            <strong>
                                {photo
                                    ? "Foto selecionada"
                                    : "Adicionar foto de perfil"}
                            </strong>

                            <p>
                                {photo
                                    ? "Clique na foto para escolher outra imagem."
                                    : "Clique na foto para selecionar uma imagem do cliente."}
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

                <div className="testimonial-form__section">

                    <div className="testimonial-form__section-header">

                        <h3>
                            Informações do Cliente
                        </h3>

                        <p>
                            Informe os dados da pessoa que
                            enviou o depoimento.
                        </p>

                    </div>


                    <div className="testimonial-form__grid">


                        <div className="testimonial-form__field">

                            <label htmlFor="testimonial-name">
                                Nome
                            </label>

                            <input
                                id="testimonial-name"
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


                        <div className="testimonial-form__field">

                            <label htmlFor="testimonial-email">
                                E-mail (opcional)
                            </label>

                            <input
                                id="testimonial-email"
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

                <div className="testimonial-form__section">

                    <div className="testimonial-form__section-header">

                        <h3>
                            Depoimento
                        </h3>

                        <p>
                            Escreva o depoimento que será
                            exibido no site.
                        </p>

                    </div>


                    <div className="testimonial-form__field">

                        <label htmlFor="testimonial-message">
                            Mensagem
                        </label>

                        <textarea
                            id="testimonial-message"
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

                <div className="testimonial-form__section">

                    <div className="testimonial-form__section-header">

                        <h3>
                            Publicação
                        </h3>

                        <p>
                            Defina se o depoimento ficará
                            visível no site.
                        </p>

                    </div>


                    <div className="testimonial-form__field">

                        <label htmlFor="testimonial-status">
                            Status
                        </label>

                        <select
                            id="testimonial-status"
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

                <div className="testimonial-form__actions">

                    <button
                        type="button"
                        className="testimonial-form__cancel"
                        onClick={() =>
                            navigate("/testimonials")
                        }
                        disabled={saving}
                    >

                        Cancelar

                    </button>


                    <button
                        type="submit"
                        className="testimonial-form__save"
                        disabled={saving}
                    >

                        <Save size={18} />

                        {saving
                            ? "Salvando..."
                            : "Salvar Depoimento"}

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


export default TestimonialForm;