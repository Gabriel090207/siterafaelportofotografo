import "./SiteProcess.css";

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
    saveSiteProcess,
    subscribeSiteProcess,
} from "../../services/firebase/siteProcess";

import type {
    SiteProcess as SiteProcessType,
} from "../../types/siteProcess";

function SiteProcess() {

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

    const [process, setProcess] =
        useState<SiteProcessType>({

            id: "",

            eyebrow: "",

            title: "",

            steps: [

                {
                    number: "01",
                    title: "",
                    description: "",
                },

                {
                    number: "02",
                    title: "",
                    description: "",
                },

                {
                    number: "03",
                    title: "",
                    description: "",
                },

                {
                    number: "04",
                    title: "",
                    description: "",
                },

            ],

        });

    useEffect(() => {

        const unsubscribe =
            subscribeSiteProcess((data) => {

                if (!data) return;

                setProcess(data);

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

            title: "Salvando Processo",

            message: "Preparando...",

        });

        try {

            updateLoading(
                40,
                "Salvando informações..."
            );

            await saveSiteProcess({

                eyebrow: process.eyebrow,

                title: process.title,

                steps: process.steps,

            });

            updateLoading(
                100,
                "Finalizando..."
            );

            setLoadingModal({

                open: true,

                success: true,

                progress: 100,

                title: "Processo",

                message:
                    "Alterações salvas com sucesso.",

            });

            showToast(
                "Processo salvo com sucesso!",
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
                "Erro ao salvar o processo.",
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

          <section className="site-process">

            <div className="site-process__top">

                <button
                    className="site-process__back"
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

                        Como Funciona

                    </h2>

                    <p>

                        Gerencie a seção de processo da página inicial.

                    </p>

                </div>

            </div>

            <div className="site-process__card">

                <h3>

                    Informações da Seção

                </h3>

                <div className="site-process__field">

                    <label>

                        Texto Superior

                    </label>

                    <input
                        value={process.eyebrow}
                        onChange={(event) =>
                            setProcess({

                                ...process,

                                eyebrow:
                                    event.target.value,

                            })
                        }
                    />

                </div>

                <div className="site-process__field">

                    <label>

                        Título

                    </label>

                    <textarea
                        value={process.title}
                        onChange={(event) =>
                            setProcess({

                                ...process,

                                title:
                                    event.target.value,

                            })
                        }
                    />

                </div>

            </div>

            {process.steps.map((step, index) => (

                <div
                    key={index}
                    className="site-process__card"
                >

                    <h3>

                        Card {index + 1}

                    </h3>

                    <div className="site-process__field">

                        <label>

                            Número

                        </label>

                        <input
                            value={step.number}
                            onChange={(event) => {

                                const steps = [
                                    ...process.steps,
                                ];

                                steps[index] = {

                                    ...step,

                                    number:
                                        event.target.value,

                                };

                                setProcess({

                                    ...process,

                                    steps,

                                });

                            }}
                        />

                    </div>

                    <div className="site-process__field">

                        <label>

                            Título

                        </label>

                        <input
                            value={step.title}
                            onChange={(event) => {

                                const steps = [
                                    ...process.steps,
                                ];

                                steps[index] = {

                                    ...step,

                                    title:
                                        event.target.value,

                                };

                                setProcess({

                                    ...process,

                                    steps,

                                });

                            }}
                        />

                    </div>

                    <div className="site-process__field">

                        <label>

                            Descrição

                        </label>

                        <textarea
                            value={step.description}
                            onChange={(event) => {

                                const steps = [
                                    ...process.steps,
                                ];

                                steps[index] = {

                                    ...step,

                                    description:
                                        event.target.value,

                                };

                                setProcess({

                                    ...process,

                                    steps,

                                });

                            }}
                        />

                    </div>

                </div>

            ))}

            <div className="site-process__actions">

                <button
                    className="site-process__cancel"
                    onClick={() =>
                        navigate("/admin/site")
                    }
                >

                    Cancelar

                </button>

                <button
                    className="site-process__save"
                    onClick={handleSave}
                    disabled={isSaving}
                >

                    <Save size={18} />

                    Salvar Alterações

                </button>

            </div>

            <LoadingModal

                open={loadingModal.open}

                progress={loadingModal.progress}

                title={loadingModal.title}

                message={loadingModal.message}

                success={loadingModal.success}

            />

            </section>

        </>

    );

}

export default SiteProcess;