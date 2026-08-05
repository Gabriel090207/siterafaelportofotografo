import "./SiteTestimonials.css";

import {
    useEffect,
    useState,
} from "react";

import {
    ArrowLeft,
    Save,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import LoadingModal from "../../components/LoadingModal/LoadingModal";

import {
    useToast,
} from "../../contexts/ToastContext";

import {
    saveSiteTestimonials,
    subscribeSiteTestimonials,
} from "../../services/firebase/siteTestimonials";

import type {
    SiteTestimonials as SiteTestimonialsType,
} from "../../types/siteTestimonials";

function SiteTestimonials() {

    const navigate = useNavigate();

    const { showToast } = useToast();

    const [isSaving, setIsSaving] =
        useState(false);

    const [loadingModal, setLoadingModal] =
        useState({

            open: false,

            success: false,

            progress: 0,

            title: "",

            message: "",

        });

    const [testimonials, setTestimonials] =
        useState<SiteTestimonialsType>({

            id: "",

            eyebrow: "",

            title: "",

            testimonials: [

                {
                    text: "",
                    name: "",
                    category: "",
                },

                {
                    text: "",
                    name: "",
                    category: "",
                },

                {
                    text: "",
                    name: "",
                    category: "",
                },

            ],

        });

    useEffect(() => {

        const unsubscribe =
            subscribeSiteTestimonials((data) => {

                if (!data) return;

                setTestimonials(data);

            });

        return unsubscribe;

    }, []);

    const updateLoading = (
        progress: number,
        message: string,
    ) => {

        setLoadingModal((current) => ({

            ...current,

            progress,

            message,

        }));

    };

    const handleSave = async () => {

        if (isSaving) return;

        setIsSaving(true);

        setLoadingModal({

            open: true,

            success: false,

            progress: 0,

            title: "Salvando Depoimentos",

            message: "Preparando...",

        });

        try {

            updateLoading(
                40,
                "Salvando informações..."
            );

            await saveSiteTestimonials({

                eyebrow:
                    testimonials.eyebrow,

                title:
                    testimonials.title,

                testimonials:
                    testimonials.testimonials,

            });

            updateLoading(
                100,
                "Finalizando..."
            );

            setLoadingModal({

                open: true,

                success: true,

                progress: 100,

                title: "Depoimentos",

                message:
                    "Alterações salvas com sucesso.",

            });

            showToast(
                "Depoimentos salvos com sucesso!",
                "success"
            );

            setTimeout(() => {

                setLoadingModal((current) => ({

                    ...current,

                    open: false,

                }));

            }, 900);

        } catch (error) {

            console.error(error);

            showToast(
                "Erro ao salvar os depoimentos.",
                "error"
            );

            setLoadingModal((current) => ({

                ...current,

                open: false,

            }));

        } finally {

            setIsSaving(false);

        }

    };

    return (

        <>

            <section className="site-testimonials">

            <div className="site-testimonials__top">

                <button
                    className="site-testimonials__back"
                    onClick={() =>
                        navigate("/admin/site")
                    }
                >

                    <ArrowLeft size={18} />

                    <span>

                        Voltar

                    </span>

                </button>

                <div>

                    <h2>

                        Depoimentos

                    </h2>

                    <p>

                        Gerencie a seção de depoimentos da página inicial.

                    </p>

                </div>

            </div>

            <div className="site-testimonials__card">

                <h3>

                    Informações da Seção

                </h3>

                <div className="site-testimonials__field">

                    <label>

                        Texto Superior

                    </label>

                    <input
                        value={testimonials.eyebrow}
                        onChange={(event) =>
                            setTestimonials({

                                ...testimonials,

                                eyebrow:
                                    event.target.value,

                            })
                        }
                    />

                </div>

                <div className="site-testimonials__field">

                    <label>

                        Título

                    </label>

                    <textarea
                        value={testimonials.title}
                        onChange={(event) =>
                            setTestimonials({

                                ...testimonials,

                                title:
                                    event.target.value,

                            })
                        }
                    />

                </div>

            </div>

            {testimonials.testimonials.map((item, index) => (

                <div
                    key={index}
                    className="site-testimonials__card"
                >

                    <h3>

                        Depoimento {index + 1}

                    </h3>

                    <div className="site-testimonials__field">

                        <label>

                            Texto

                        </label>

                        <textarea
                            value={item.text}
                            onChange={(event) => {

                                const items = [
                                    ...testimonials.testimonials,
                                ];

                                items[index] = {

                                    ...item,

                                    text:
                                        event.target.value,

                                };

                                setTestimonials({

                                    ...testimonials,

                                    testimonials: items,

                                });

                            }}
                        />

                    </div>

                    <div className="site-testimonials__field">

                        <label>

                            Nome

                        </label>

                        <input
                            value={item.name}
                            onChange={(event) => {

                                const items = [
                                    ...testimonials.testimonials,
                                ];

                                items[index] = {

                                    ...item,

                                    name:
                                        event.target.value,

                                };

                                setTestimonials({

                                    ...testimonials,

                                    testimonials: items,

                                });

                            }}
                        />

                    </div>

                    <div className="site-testimonials__field">

                        <label>

                            Categoria

                        </label>

                        <input
                            value={item.category}
                            onChange={(event) => {

                                const items = [
                                    ...testimonials.testimonials,
                                ];

                                items[index] = {

                                    ...item,

                                    category:
                                        event.target.value,

                                };

                                setTestimonials({

                                    ...testimonials,

                                    testimonials: items,

                                });

                            }}
                        />

                    </div>

                </div>

            ))}

            <div className="site-testimonials__actions">

                <button
                    className="site-testimonials__cancel"
                    onClick={() =>
                        navigate("/admin/site")
                    }
                >

                    Cancelar

                </button>

                <button
                    className="site-testimonials__save"
                    onClick={handleSave}
                    disabled={isSaving}
                >

                    <Save size={18} />

                    Salvar Alterações

                </button>

            </div>

        </section>

            <LoadingModal

                open={loadingModal.open}

                progress={loadingModal.progress}

                title={loadingModal.title}

                message={loadingModal.message}

                success={loadingModal.success}

            />

        </>

    );

}

export default SiteTestimonials;