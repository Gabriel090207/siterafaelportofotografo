import "./SiteHero.css";

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

import {
    saveSiteHero,
    subscribeSiteHero,
} from "../../services/firebase/siteHero";

import {
    deleteFile,
    uploadSiteHeroBackground,
} from "../../services/firebase/storageService";

import LoadingModal from "../../components/LoadingModal/LoadingModal";

import {
    useToast,
} from "../../contexts/ToastContext";

import {
    getErrorMessage,
} from "../../utils/errorMessage";

import type {
    SiteHero as SiteHeroType,
} from "../../types/siteHero";

function SiteHero() {

    const navigate = useNavigate();

    const { showToast } = useToast();

    const backgroundInputRef =
        useRef<HTMLInputElement>(null);

    const [hero, setHero] =
        useState<SiteHeroType>({
            id: "",

            eyebrow: "",

            title: "",

            description: "",

            backgroundUrl: "",

            backgroundStoragePath: "",
        });

    const [isSaving, setIsSaving] =
        useState(false);

    const [backgroundFile, setBackgroundFile] =
        useState<File | null>(null);

    const [loadingModal, setLoadingModal] =
        useState({

            open: false,

            success: false,

            progress: 0,

            title: "Salvando Hero",

            message: "Preparando...",

        });

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

    useEffect(() => {

        const unsubscribe =
            subscribeSiteHero((data) => {

                if (!data) return;

                setHero(data);

            });

        return unsubscribe;

    }, []);

    const handleSave = async () => {

        if (isSaving) return;

        setIsSaving(true);

        setLoadingModal({

            open: true,

            success: false,

            progress: 0,

            title: "Salvando Hero",

            message: "Preparando...",

        });

        try {

            updateLoading(
                25,
                "Preparando..."
            );

            let backgroundUrl =
                hero.backgroundUrl;

            let backgroundStoragePath =
                hero.backgroundStoragePath;

            if (backgroundFile) {

                updateLoading(
                    60,
                    "Enviando imagem..."
                );

                if (hero.backgroundStoragePath) {

                    await deleteFile(
                        hero.backgroundStoragePath
                    );

                }

                const upload =
                    await uploadSiteHeroBackground(
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

            await saveSiteHero({

                eyebrow:
                    hero.eyebrow,

                title:
                    hero.title,

                description:
                    hero.description,

                backgroundUrl,

                backgroundStoragePath,

            });

            updateLoading(
                100,
                "Concluindo..."
            );

            setLoadingModal({

                open: true,

                success: true,

                progress: 100,

                title: "Hero salvo",

                message:
                    "As alterações foram salvas com sucesso.",

            });

            showToast(
                "Hero salvo com sucesso!",
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

            setLoadingModal((current) => ({

                ...current,

                open: false,

            }));

            showToast(
                getErrorMessage(error),
                "error"
            );

        } finally {

            setIsSaving(false);

        }

    };

    return (

        <section className="site-hero">

            <div className="site-hero__top">

                <button
                    className="site-hero__back"
                    onClick={() => navigate("/admin/site")}
                >

                    <ArrowLeft size={18} />

                    <span>Voltar</span>

                </button>

                <div className="site-hero__title">

                    <h2>Hero</h2>

                    <p>
                        Gerencie a primeira seção exibida na página inicial.
                    </p>

                </div>

            </div>

            <div className="site-hero__card">

                <h3>Informações</h3>

                <div className="site-hero__field">

                    <label>Texto Superior</label>

                    <input
                        type="text"
                        placeholder="FOTOGRAFIA • FILME • EMOÇÃO"
                        value={hero.eyebrow}
                        onChange={(event) =>
                            setHero({
                                ...hero,
                                eyebrow: event.target.value,
                            })
                        }
                    />

                </div>

                <div className="site-hero__field">

                    <label>Título Principal</label>

                    <textarea
                        placeholder="Momentos únicos merecem ser eternizados..."
                        value={hero.title}
                        onChange={(event) =>
                            setHero({
                                ...hero,
                                title: event.target.value,
                            })
                        }
                    />

                </div>

                <div className="site-hero__field">

                    <label>Descrição</label>

                    <textarea
                        placeholder="Descrição..."
                        value={hero.description}
                        onChange={(event) =>
                            setHero({
                                ...hero,
                                description: event.target.value,
                            })
                        }
                    />

                </div>

            </div>

            <div className="site-hero__card">

                <h3>Imagem de Fundo</h3>

                <button
                    type="button"
                    className="site-hero__cover"
                    onClick={() =>
                        backgroundInputRef.current?.click()
                    }
                >

                    <FolderOpen size={20} />

                    {hero.backgroundUrl
                        ? "Alterar imagem"
                        : "Escolher imagem"}

                </button>

                <input
                    ref={backgroundInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(event) => {

                        const file =
                            event.target.files?.[0];

                        if (!file) return;

                        setBackgroundFile(file);

                        setHero((current) => ({

                            ...current,

                            backgroundUrl:
                                URL.createObjectURL(file),

                        }));

                    }}
                />

                {hero.backgroundUrl && (

                    <div className="site-hero__preview">

                        <img
                            src={hero.backgroundUrl}
                            alt="Hero"
                        />

                    </div>

                )}

            </div>

            <div className="site-hero__actions">

                <button
                    className="site-hero__cancel"
                    onClick={() => navigate("/admin/site")}
                >

                    Cancelar

                </button>

                <button
                    type="button"
                    className="site-hero__save"
                    onClick={handleSave}
                    disabled={isSaving}
                >

                    <Save size={18} />

                    {isSaving
                        ? "Salvando..."
                        : "Salvar Alterações"}

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

    );

}

export default SiteHero;