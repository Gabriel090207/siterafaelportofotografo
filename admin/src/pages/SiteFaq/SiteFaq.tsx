import "./SiteFaq.css";

import {
    useEffect,
    useState,
} from "react";

import {
    ArrowLeft,
    Plus,
    Save,
    Trash2,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import LoadingModal from "../../components/LoadingModal/LoadingModal";

import {
    useToast,
} from "../../contexts/ToastContext";

import {
    saveSiteFaq,
    subscribeSiteFaq,
} from "../../services/firebase/siteFaq";

import type {
    SiteFaq as SiteFaqType,
} from "../../types/siteFaq";

function SiteFaq() {

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

    const [faq, setFaq] =
        useState<SiteFaqType>({

            id: "",

            eyebrow: "",

            title: "",

            items: [],

        });

    useEffect(() => {

        const unsubscribe =
            subscribeSiteFaq((data) => {

                if (!data) return;

                setFaq(data);

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

            title: "Salvando FAQ",

            message: "Preparando...",

        });

        try {

            updateLoading(
                40,
                "Salvando perguntas..."
            );

            await saveSiteFaq({

                eyebrow:
                    faq.eyebrow,

                title:
                    faq.title,

                items:
                    faq.items,

            });

            updateLoading(
                100,
                "Finalizando..."
            );

            setLoadingModal({

                open: true,

                success: true,

                progress: 100,

                title: "FAQ",

                message:
                    "Alterações salvas com sucesso.",

            });

            showToast(
                "FAQ salvo com sucesso!",
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
                "Erro ao salvar o FAQ.",
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

            <section className="site-faq">

                <div className="site-faq__top">

                    <button
                        className="site-faq__back"
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

                            FAQ

                        </h2>

                        <p>

                            Gerencie as perguntas frequentes da página inicial.

                        </p>

                    </div>

                </div>

                <div className="site-faq__card">

                    <h3>

                        Informações da Seção

                    </h3>

                    <div className="site-faq__field">

                        <label>

                            Texto Superior

                        </label>

                        <input
                            value={faq.eyebrow}
                            onChange={(event) =>
                                setFaq({

                                    ...faq,

                                    eyebrow:
                                        event.target.value,

                                })
                            }
                        />

                    </div>

                    <div className="site-faq__field">

                        <label>

                            Título

                        </label>

                        <textarea
                            value={faq.title}
                            onChange={(event) =>
                                setFaq({

                                    ...faq,

                                    title:
                                        event.target.value,

                                })
                            }
                        />

                    </div>

                </div>

                {faq.items.map((item, index) => (

                    <div
                        key={index}
                        className="site-faq__card"
                    >

                        <h3>

                            Pergunta {index + 1}

                        </h3>

                        <div className="site-faq__field">

                            <label>

                                Pergunta

                            </label>

                            <input
                                value={item.question}
                                onChange={(event) => {

                                    const items = [
                                        ...faq.items,
                                    ];

                                    items[index] = {

                                        ...item,

                                        question:
                                            event.target.value,

                                    };

                                    setFaq({

                                        ...faq,

                                        items,

                                    });

                                }}
                            />

                        </div>

                        <div className="site-faq__field">

                            <label>

                                Resposta

                            </label>

                            <textarea
                                value={item.answer}
                                onChange={(event) => {

                                    const items = [
                                        ...faq.items,
                                    ];

                                    items[index] = {

                                        ...item,

                                        answer:
                                            event.target.value,

                                    };

                                    setFaq({

                                        ...faq,

                                        items,

                                    });

                                }}
                            />

                        </div>

                        <button
                            type="button"
                            className="site-faq__remove"
                            onClick={() => {

                                setFaq({

                                    ...faq,

                                    items:
                                        faq.items.filter(

                                            (_, i) =>
                                                i !== index

                                        ),

                                });

                            }}
                        >

                            <Trash2 size={18} />

                            Excluir Pergunta

                        </button>

                    </div>

                ))}

                <button
                    type="button"
                    className="site-faq__add"
                    onClick={() => {

                        setFaq({

                            ...faq,

                            items: [

                                ...faq.items,

                                {

                                    question: "",

                                    answer: "",

                                },

                            ],

                        });

                    }}
                >

                    <Plus size={18} />

                    Adicionar Pergunta

                </button>

                <div className="site-faq__actions">

                    <button
                        className="site-faq__cancel"
                        onClick={() =>
                            navigate("/admin/site")
                        }
                    >

                        Cancelar

                    </button>

                    <button
                        className="site-faq__save"
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

export default SiteFaq;