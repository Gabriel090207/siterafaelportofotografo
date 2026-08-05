import "./SiteAgenda.css";

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
    saveSiteAgenda,
    subscribeSiteAgenda,
} from "../../services/firebase/siteAgenda";

import type {
    SiteAgenda as SiteAgendaType,
} from "../../types/siteAgenda";

function SiteAgenda() {

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

    const [agenda, setAgenda] =
        useState<SiteAgendaType>({

            id: "",

            eyebrow: "",

            title: "",

            description: "",

        });

    useEffect(() => {

        const unsubscribe =
            subscribeSiteAgenda((data) => {

                if (!data) return;

                setAgenda(data);

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

            title: "Salvando Agenda",

            message: "Preparando...",

        });

        try {

            updateLoading(
                40,
                "Salvando informações..."
            );

            await saveSiteAgenda({

                eyebrow:
                    agenda.eyebrow,

                title:
                    agenda.title,

                description:
                    agenda.description,

            });

            updateLoading(
                100,
                "Finalizando..."
            );

            setLoadingModal({

                open: true,

                success: true,

                progress: 100,

                title: "Agenda",

                message:
                    "Alterações salvas com sucesso.",

            });

            showToast(
                "Agenda salva com sucesso!",
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
                "Erro ao salvar a agenda.",
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

            <section className="site-agenda">

                <div className="site-agenda__top">

                    <button
                        className="site-agenda__back"
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

                            Agenda

                        </h2>

                        <p>

                            Gerencie a seção Agenda da página inicial.

                        </p>

                    </div>

                </div>

                <div className="site-agenda__card">

                    <h3>

                        Informações da Seção

                    </h3>

                    <div className="site-agenda__field">

                        <label>

                            Texto Superior

                        </label>

                        <input
                            value={agenda.eyebrow}
                            onChange={(event) =>
                                setAgenda({

                                    ...agenda,

                                    eyebrow:
                                        event.target.value,

                                })
                            }
                        />

                    </div>

                    <div className="site-agenda__field">

                        <label>

                            Título

                        </label>

                        <textarea
                            value={agenda.title}
                            onChange={(event) =>
                                setAgenda({

                                    ...agenda,

                                    title:
                                        event.target.value,

                                })
                            }
                        />

                    </div>

                    <div className="site-agenda__field">

                        <label>

                            Descrição

                        </label>

                        <textarea
                            value={agenda.description}
                            onChange={(event) =>
                                setAgenda({

                                    ...agenda,

                                    description:
                                        event.target.value,

                                })
                            }
                        />

                    </div>

                </div>

                <div className="site-agenda__actions">

                    <button
                        className="site-agenda__cancel"
                        onClick={() =>
                            navigate("/admin/site")
                        }
                    >

                        Cancelar

                    </button>

                    <button
                        className="site-agenda__save"
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

export default SiteAgenda;