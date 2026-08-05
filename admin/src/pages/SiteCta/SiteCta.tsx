import "./SiteCta.css";

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
    saveSiteCta,
    subscribeSiteCta,
} from "../../services/firebase/siteCta";

import type {
    SiteCta as SiteCtaType,
} from "../../types/siteCta";

function SiteCta() {

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

    const [cta, setCta] =
        useState<SiteCtaType>({

            id: "",

            title: "",

            description: "",

        });

    useEffect(() => {

        const unsubscribe =
            subscribeSiteCta((data) => {

                if (!data) return;

                setCta(data);

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

            title: "Salvando CTA",

            message: "Preparando...",

        });

        try {

            updateLoading(
                40,
                "Salvando informações..."
            );

            await saveSiteCta({

                title:
                    cta.title,

                description:
                    cta.description,

            });

            updateLoading(
                100,
                "Finalizando..."
            );

            setLoadingModal({

                open: true,

                success: true,

                progress: 100,

                title: "CTA",

                message:
                    "Alterações salvas com sucesso.",

            });

            showToast(
                "CTA salvo com sucesso!",
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
                "Erro ao salvar o CTA.",
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

            <section className="site-cta">

                <div className="site-cta__top">

                    <button
                        className="site-cta__back"
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

                            CTA

                        </h2>

                        <p>

                            Gerencie a chamada para ação da página inicial.

                        </p>

                    </div>

                </div>

                <div className="site-cta__card">

                    <h3>

                        Informações da Seção

                    </h3>

                    <div className="site-cta__field">

                        <label>

                            Título

                        </label>

                        <textarea
                            value={cta.title}
                            onChange={(event) =>
                                setCta({

                                    ...cta,

                                    title:
                                        event.target.value,

                                })
                            }
                        />

                    </div>

                    <div className="site-cta__field">

                        <label>

                            Descrição

                        </label>

                        <textarea
                            value={cta.description}
                            onChange={(event) =>
                                setCta({

                                    ...cta,

                                    description:
                                        event.target.value,

                                })
                            }
                        />

                    </div>

                </div>

                <div className="site-cta__actions">

                    <button
                        className="site-cta__cancel"
                        onClick={() =>
                            navigate("/admin/site")
                        }
                    >

                        Cancelar

                    </button>

                    <button
                        className="site-cta__save"
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

export default SiteCta;