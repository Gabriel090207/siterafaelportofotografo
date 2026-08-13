import "./Testimonials.css";

import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    FiCamera,
    FiSend,
    FiUser,
} from "react-icons/fi";

import {
    createTestimonial,
    subscribeTestimonials,
} from "../../services/firebase/testimonials";

import type {
    Testimonial,
} from "../../services/firebase/testimonials";


function Testimonials() {

    const [testimonials, setTestimonials] =
        useState<Testimonial[]>([]);

    const [name, setName] =
        useState("");

    const [email, setEmail] =
        useState("");

    const [message, setMessage] =
        useState("");

    const [photo, setPhoto] =
        useState<File | null>(null);

    const [photoPreview, setPhotoPreview] =
        useState<string | null>(null);

    const [isSending, setIsSending] =
        useState(false);

    const [error, setError] =
        useState("");

    const fileInputRef =
        useRef<HTMLInputElement | null>(null);


    /* ===================================
       CARREGAR DEPOIMENTOS
    =================================== */

    useEffect(() => {

        const unsubscribe =
            subscribeTestimonials(
                setTestimonials
            );

        return unsubscribe;

    }, []);


    /* ===================================
       LIMPAR PREVIEW DA FOTO
    =================================== */

    useEffect(() => {

        return () => {

            if (photoPreview) {
                URL.revokeObjectURL(
                    photoPreview
                );
            }

        };

    }, [photoPreview]);


    /* ===================================
       SELECIONAR FOTO
    =================================== */

    const handlePhotoChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {

        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }


        if (!file.type.startsWith("image/")) {

            setError(
                "Selecione uma imagem válida."
            );

            return;

        }


        if (file.size > 5 * 1024 * 1024) {

            setError(
                "A foto deve ter no máximo 5 MB."
            );

            return;

        }


        if (photoPreview) {

            URL.revokeObjectURL(
                photoPreview
            );

        }


        const preview =
            URL.createObjectURL(file);


        setPhoto(file);

        setPhotoPreview(preview);

        setError("");

    };


    /* ===================================
       ENVIAR DEPOIMENTO
    =================================== */

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {

        event.preventDefault();


        if (
            !name.trim() ||
            !email.trim() ||
            !message.trim()
        ) {

            setError(
                "Preencha todos os campos."
            );

            return;

        }


        if (!photo) {

            setError(
                "Adicione uma foto de perfil."
            );

            return;

        }


        try {

            setIsSending(true);

            setError("");

            await createTestimonial({
                name,
                email,
                message,
                photo,
            });


            setName("");
            setEmail("");
            setMessage("");
            setPhoto(null);


            if (photoPreview) {

                URL.revokeObjectURL(
                    photoPreview
                );

            }


            setPhotoPreview(null);


            if (fileInputRef.current) {

                fileInputRef.current.value =
                    "";

            }

        } catch (error) {

            console.error(
                "Erro ao enviar depoimento:",
                error
            );

            setError(
                "Não foi possível enviar o depoimento. Tente novamente."
            );


        } finally {

            setIsSending(false);

        }

    };


    return (

        <main className="testimonials-page">

            <div className="testimonials-page-container">


                {/* =========================
                    HEADER
                ========================= */}

                <section className="testimonials-page-header">

                    <div className="testimonials-page-eyebrow">

                        <span></span>

                        <p>
                            DEPOIMENTOS
                        </p>

                    </div>


                    <h1>
                        Histórias contadas
                        por quem viveu.
                    </h1>


                    <p className="testimonials-page-description">

                        Cada registro carrega uma história.
                        Aqui, nossos clientes compartilham
                        um pouco da experiência de transformar
                        momentos especiais em memórias para
                        toda a vida.

                    </p>

                </section>


                {/* =========================
                    FORMULÁRIO
                ========================= */}

                <section className="testimonials-page-form-section">

                    <form
                        className="testimonials-page-form"
                        onSubmit={handleSubmit}
                    >

                        <div className="testimonials-page-photo-field">


                            <button
                                type="button"
                                className="testimonials-page-photo-button"
                                onClick={() =>
                                    fileInputRef.current?.click()
                                }
                            >

                                {photoPreview ? (

                                    <img
                                        src={photoPreview}
                                        alt="Prévia da foto de perfil"
                                    />

                                ) : (

                                    <FiCamera />

                                )}

                            </button>


                            <div className="testimonials-page-photo-info">

                                <strong>
                                    Foto de perfil
                                </strong>

                                <span>
                                    Clique na imagem para escolher sua foto.
                                </span>

                            </div>


                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                className="testimonials-page-file-input"
                            />

                        </div>


                        <div className="testimonials-page-fields-row">


                            <div className="testimonials-page-field">

                                <label htmlFor="testimonial-name">

                                    Nome

                                </label>

                                <input
                                    id="testimonial-name"
                                    type="text"
                                    value={name}
                                    onChange={(event) =>
                                        setName(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Seu nome"
                                    maxLength={80}
                                    autoComplete="name"
                                />

                            </div>


                            <div className="testimonials-page-field">

                                <label htmlFor="testimonial-email">

                                    E-mail

                                </label>

                                <input
                                    id="testimonial-email"
                                    type="email"
                                    value={email}
                                    onChange={(event) =>
                                        setEmail(
                                            event.target.value
                                        )
                                    }
                                    placeholder="seu@email.com"
                                    maxLength={120}
                                    autoComplete="email"
                                />

                            </div>


                        </div>


                        <div className="testimonials-page-field">

                            <label htmlFor="testimonial-message">

                                Depoimento

                            </label>

                            <textarea
                                id="testimonial-message"
                                value={message}
                                onChange={(event) =>
                                    setMessage(
                                        event.target.value
                                    )
                                }
                                placeholder="Conte como foi sua experiência..."
                                maxLength={1000}
                                rows={6}
                            />

                            <span className="testimonials-page-character-count">

                                {message.length}/1000

                            </span>

                        </div>


                        {error && (

                            <div className="testimonials-page-message testimonials-page-message-error">

                                {error}

                            </div>

                        )}

                        <div className="testimonials-page-form-footer">

                            <p>
                                Seu e-mail não será exibido
                                publicamente.
                            </p>


                            <button
                                type="submit"
                                className="testimonials-page-submit"
                                disabled={isSending}
                            >

                                <span>

                                    {isSending
                                        ? "Enviando..."
                                        : "Enviar depoimento"}

                                </span>

                                <FiSend />

                            </button>

                        </div>


                    </form>

                </section>


                {/* =========================
                    LISTA
                ========================= */}

                <section className="testimonials-page-list-section">


                    <div className="testimonials-page-list-heading">

                        <div className="testimonials-page-list-eyebrow">

                            <span></span>

                            <p>
                                EXPERIÊNCIAS
                            </p>

                        </div>


                        <h2>
                            O que os nossos clientes dizem.
                        </h2>

                    </div>


                    {testimonials.length === 0 ? (

                        <div className="testimonials-page-empty">

                            <FiUser />

                            <h3>
                                Nenhum depoimento ainda.
                            </h3>

                            <p>
                                Seja a primeira pessoa a
                                compartilhar sua experiência.
                            </p>

                        </div>

                    ) : (

                        <div className="testimonials-page-grid">

                            {testimonials.map(
                                (testimonial) => (

                                    <article
                                        key={testimonial.id}
                                        className="testimonials-page-card"
                                    >


                                        <div className="testimonials-page-card-header">

                                            <img
                                                src={testimonial.photoUrl}
                                                alt={testimonial.name}
                                            />


                                            <div>

                                                <h3>
                                                    {testimonial.name}
                                                </h3>

                                                <span>
                                                    Cliente
                                                </span>

                                            </div>

                                        </div>


                                        <p className="testimonials-page-card-message">

                                            “{testimonial.message}”

                                        </p>


                                    </article>

                                )
                            )}

                        </div>

                    )}


                </section>


            </div>

        </main>

    );

}

export default Testimonials;