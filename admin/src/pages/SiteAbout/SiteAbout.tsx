import "./SiteAbout.css";

import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    ArrowLeft,
    FolderOpen,
    Save,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import LoadingModal from "../../components/LoadingModal/LoadingModal";

import {
    useToast,
} from "../../contexts/ToastContext";

import {
    saveSiteAbout,
    subscribeSiteAbout,
} from "../../services/firebase/siteAbout";

import {
    deleteFile,
    uploadSiteAboutBackground,
} from "../../services/firebase/storageService";

import type {
    SiteAbout as SiteAboutType,
} from "../../types/siteAbout";

function SiteAbout() {

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

    const [about, setAbout] =
        useState<SiteAboutType>({

            id: "",

            eyebrow: "",

            title: "",

            description: "",

            backgroundUrl: "",

            backgroundStoragePath: "",

        });

    const backgroundInputRef =
        useRef<HTMLInputElement>(null);

    const [backgroundFile, setBackgroundFile] =
        useState<File | null>(null);

    useEffect(() => {

        const unsubscribe =
            subscribeSiteAbout((data) => {

                if (!data) return;

                setAbout(data);

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

            title: "Salvando Sobre",

            message: "Preparando...",

        });

        try {

            let backgroundUrl =
                about.backgroundUrl;

            let backgroundStoragePath =
                about.backgroundStoragePath;

            if (backgroundFile) {

                updateLoading(
                    40,
                    "Enviando imagem..."
                );

                if (backgroundStoragePath) {

                    await deleteFile(
                        backgroundStoragePath
                    );

                }

                const upload =

                    await uploadSiteAboutBackground(
                        backgroundFile
                    );

                backgroundUrl =
                    upload.url;

                backgroundStoragePath =
                    upload.storagePath;

            }

            updateLoading(
                90,
                "Salvando informações..."
            );

            await saveSiteAbout({

                eyebrow:
                    about.eyebrow,

                title:
                    about.title,

                description:
                    about.description,

                backgroundUrl,

                backgroundStoragePath,

            });

            updateLoading(
                100,
                "Finalizando..."
            );

            setBackgroundFile(null);

            setLoadingModal({

                open: true,

                success: true,

                progress: 100,

                title: "Sobre",

                message:
                    "Alterações salvas com sucesso.",

            });

            showToast(
                "Sobre salvo com sucesso!",
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
                "Erro ao salvar o Sobre.",
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

            <section className="site-about">

                <div className="site-about__top">

                    <button
                        className="site-about__back"
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

                            Sobre

                        </h2>

                        <p>

                            Gerencie a seção Sobre da página inicial.

                        </p>

                    </div>

                </div>

                <div className="site-about__card">

                    <h3>

                        Informações da Seção

                    </h3>

                    <div className="site-about__field">

                        <label>

                            Texto Superior

                        </label>

                        <input
                            value={about.eyebrow}
                            onChange={(event) =>
                                setAbout({

                                    ...about,

                                    eyebrow:
                                        event.target.value,

                                })
                            }
                        />

                    </div>

                    <div className="site-about__field">

                        <label>

                            Título

                        </label>

                        <textarea
                            value={about.title}
                            onChange={(event) =>
                                setAbout({

                                    ...about,

                                    title:
                                        event.target.value,

                                })
                            }
                        />

                    </div>

                    <div className="site-about__field">

                        <label>

                            Descrição

                        </label>

                        <textarea
                            value={about.description}
                            onChange={(event) =>
                                setAbout({

                                    ...about,

                                    description:
                                        event.target.value,

                                })
                            }
                        />

                    </div>

                </div>

                <div className="site-about__card">

                    <h3>

                        Imagem de Fundo

                    </h3>

                    <button

                        type="button"

                        className="site-about__upload"

                        onClick={() =>
                            backgroundInputRef.current?.click()
                        }

                    >

                        <FolderOpen size={18} />

                        Escolher imagem

                    </button>

                    <input

                        ref={backgroundInputRef}

                        hidden

                        type="file"

                        accept="image/*"

                        onChange={(event) => {

                            const file =
                                event.target.files?.[0];

                            if (!file) return;

                            setBackgroundFile(file);

                            setAbout({

                                ...about,

                                backgroundUrl:
                                    URL.createObjectURL(file),

                            });

                        }}

                    />

                    {about.backgroundUrl && (

                        <div className="site-about__preview">

                            <img
                                src={about.backgroundUrl}
                                alt="Background"
                            />

                        </div>

                    )}

                </div>

                <div className="site-about__actions">

                    <button

                        className="site-about__cancel"

                        onClick={() =>
                            navigate("/admin/site")
                        }

                    >

                        Cancelar

                    </button>

                    <button
                        className="site-about__save"
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

export default SiteAbout;