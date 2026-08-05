import "./SiteFilms.css";

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
    saveSiteFilms,
    subscribeSiteFilms,
} from "../../services/firebase/siteFilms";

import {
    deleteFile,
    uploadSiteFilmsThumbnail,
    uploadSiteFilmVideo,
} from "../../services/firebase/storageService";

import type {
    SiteFilms as SiteFilmsType,
} from "../../types/siteFilms";

function SiteFilms() {

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

    const [film, setFilm] =
        useState<SiteFilmsType>({
            id: "",

            eyebrow: "",

            title: "",

            description: "",

            thumbnailUrl: "",

            thumbnailStoragePath: "",

            videoUrl: "",

            videoStoragePath: "",

            features: [

                {
                    title: "",
                    description: "",
                },

                {
                    title: "",
                    description: "",
                },

                {
                    title: "",
                    description: "",
                },

            ],
        });

    const thumbnailInputRef =
        useRef<HTMLInputElement>(null);

    const videoInputRef =
        useRef<HTMLInputElement>(null);

    const [thumbnailFile, setThumbnailFile] =
        useState<File | null>(null);

    const [videoFile, setVideoFile] =
        useState<File | null>(null);

    useEffect(() => {

        const unsubscribe =
            subscribeSiteFilms((data) => {

                if (!data) return;

                setFilm(data);

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

            title: "Salvando vídeos",

            message: "Preparando...",

        });

        try {

            let thumbnailUrl =
                film.thumbnailUrl;

            let thumbnailStoragePath =
                film.thumbnailStoragePath;

            let videoUrl =
                film.videoUrl;

            let videoStoragePath =
                film.videoStoragePath;

            if (thumbnailFile) {

                updateLoading(
                    20,
                    "Enviando thumbnail..."
                );

                if (thumbnailStoragePath) {

                    await deleteFile(
                        thumbnailStoragePath
                    );

                }

                const upload =

                    await uploadSiteFilmsThumbnail(
                        thumbnailFile
                    );

                thumbnailUrl =
                    upload.url;

                thumbnailStoragePath =
                    upload.storagePath;

            }

            if (videoFile) {

                updateLoading(
                    60,
                    "Enviando vídeo..."
                );

                if (videoStoragePath) {

                    await deleteFile(
                        videoStoragePath
                    );

                }

                const upload =

                    await uploadSiteFilmVideo(
                        videoFile
                    );

                videoUrl =
                    upload.url;

                videoStoragePath =
                    upload.storagePath;

            }

            updateLoading(
                90,
                "Salvando informações..."
            );

            await saveSiteFilms({

                eyebrow:
                    film.eyebrow,

                title:
                    film.title,

                description:
                    film.description,

                thumbnailUrl,

                thumbnailStoragePath,

                videoUrl,

                videoStoragePath,

                features:
                    film.features,

            });

            updateLoading(
                100,
                "Finalizando..."
            );

            setThumbnailFile(null);

            setVideoFile(null);

            setLoadingModal({

                open: true,

                success: true,

                progress: 100,

                title: "Vídeos",

                message:
                    "Alterações salvas com sucesso.",

            });

            showToast(
                "Vídeos salvos com sucesso!",
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
                "Erro ao salvar os vídeos.",
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

            <section className="site-films">

                <div className="site-films__top">

                    <button

                        className="site-films__back"

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

                            Vídeos

                        </h2>

                        <p>

                            Gerencie a seção de vídeos da página inicial.

                        </p>

                    </div>

                </div>

                <div className="site-films__card">

                    <h3>

                        Informações da Seção

                    </h3>

                    <div className="site-films__field">

                        <label>

                            Texto Superior

                        </label>

                        <input
                            value={film.eyebrow}
                            onChange={(event) =>
                                setFilm({

                                    ...film,

                                    eyebrow:
                                        event.target.value,

                                })
                            }
                        />

                    </div>

                    <div className="site-films__field">

                        <label>

                            Título

                        </label>

                        <textarea
                            value={film.title}
                            onChange={(event) =>
                                setFilm({

                                    ...film,

                                    title:
                                        event.target.value,

                                })
                            }
                        />

                    </div>

                    <div className="site-films__field">

                        <label>

                            Descrição

                        </label>

                        <textarea
                            value={film.description}
                            onChange={(event) =>
                                setFilm({

                                    ...film,

                                    description:
                                        event.target.value,

                                })
                            }
                        />

                    </div>

                </div>

                <div className="site-films__card">

                    <h3>

                        Vídeo

                    </h3>

                    <button

                        type="button"

                        className="site-films__upload"

                        onClick={() =>
                            thumbnailInputRef.current?.click()
                        }

                    >

                        <FolderOpen size={18} />

                        Escolher Capa do Video

                    </button>

                    <input

                        ref={thumbnailInputRef}

                        hidden

                        type="file"

                        accept="image/*"

                        onChange={(event) => {

                            const file =
                                event.target.files?.[0];

                            if (!file) return;

                            setThumbnailFile(file);

                            setFilm({

                                ...film,

                                thumbnailUrl:
                                    URL.createObjectURL(file),

                            });

                        }}

                    />

                    {film.thumbnailUrl && (

                        <div className="site-films__preview">

                            <img
                                src={film.thumbnailUrl}
                                alt="Thumbnail"
                            />

                        </div>

                    )}

                    <div className="site-films__field">

                        <button

                            type="button"

                            className="site-films__upload"

                            onClick={() =>
                                videoInputRef.current?.click()
                            }

                        >

                            <FolderOpen size={18} />

                            Escolher vídeo

                        </button>

                        <input

                            ref={videoInputRef}

                            hidden

                            type="file"

                            accept="video/*"

                            onChange={(event) => {

                                const file =
                                    event.target.files?.[0];

                                if (!file) return;

                                setVideoFile(file);

                            }}

                        />

                        {videoFile && (

                            <p className="site-films__filename">

                                Vídeo selecionado:
                                {" "}
                                {videoFile.name}

                            </p>

                        )}

                        {!videoFile && film.videoUrl && (

                            <p className="site-films__filename">

                                Vídeo já enviado.

                            </p>

                        )}

                    </div>

                </div>

                {film.features.map((feature, index) => (

                    <div
                        key={index}
                        className="site-films__card"
                    >

                        <h3>

                            Card {index + 1}

                        </h3>

                        <div className="site-films__field">

                            <label>

                                Título

                            </label>

                            <input
                                value={feature.title}
                                onChange={(event) => {

                                    const updatedFeatures = [
                                        ...film.features,
                                    ];

                                    updatedFeatures[index] = {

                                        ...feature,

                                        title:
                                            event.target.value,

                                    };

                                    setFilm({

                                        ...film,

                                        features:
                                            updatedFeatures,

                                    });

                                }}
                            />

                        </div>

                        <div className="site-films__field">

                            <label>

                                Descrição

                            </label>

                           <textarea
                                value={feature.description}
                                onChange={(event) => {

                                    const updatedFeatures = [
                                        ...film.features,
                                    ];

                                    updatedFeatures[index] = {

                                        ...feature,

                                        description:
                                            event.target.value,

                                    };

                                    setFilm({

                                        ...film,

                                        features:
                                            updatedFeatures,

                                    });

                                }}
                            />

                        </div>

                    </div>

                ))}

                <div className="site-films__actions">

                    <button

                        className="site-films__cancel"

                        onClick={() =>
                            navigate("/admin/site")
                        }

                    >

                        Cancelar

                    </button>

                    <button
                        className="site-films__save"
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

export default SiteFilms;