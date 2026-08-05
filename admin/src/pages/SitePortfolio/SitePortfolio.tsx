import "./SitePortfolio.css";

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
    saveSitePortfolio,
    subscribeSitePortfolio,
} from "../../services/firebase/sitePortfolio";

import {
    deleteFile,
    uploadSitePortfolioImage,
} from "../../services/firebase/storageService";

import type {
    SitePortfolio as SitePortfolioType,
} from "../../types/sitePortfolio";

function SitePortfolio() {

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

    const [files, setFiles] =
        useState<Record<number, File>>({});

    const [data, setData] =
        useState<SitePortfolioType>({
            id: "",

            eyebrow: "",

            title: "",

            description: "",

            items: [],
        });

    const fileInputs =
        useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {

        const unsubscribe =
            subscribeSitePortfolio((portfolio) => {

                if (!portfolio) return;

                setData(portfolio);

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

            title: "Salvando Portfólio",

            message: "Preparando...",

        });

        try {

            updateLoading(
                20,
                "Preparando arquivos..."
            );

            const updatedItems =
                [...data.items];

            for (
                let index = 0;
                index < updatedItems.length;
                index++
            ) {

                const currentItem =
                    updatedItems[index];

                if (!currentItem) continue;

                const file =
                    files[index];

                if (!file) continue;

                updateLoading(

                    30 + (index * 15),

                    `Enviando imagem ${index + 1}...`

                );

                if (
                    currentItem.imageStoragePath
                ) {

                    await deleteFile(
                        currentItem.imageStoragePath
                    );

                }

                const upload =

                    await uploadSitePortfolioImage(

                        index + 1,

                        file

                    );

                updatedItems[index] = {

                    ...currentItem,

                    imageUrl:
                        upload.url,

                    imageStoragePath:
                        upload.storagePath,

                };

            }

            updateLoading(
                90,
                "Salvando informações..."
            );

            await saveSitePortfolio({

                eyebrow:
                    data.eyebrow,

                title:
                    data.title,

                description:
                    data.description,

                items:
                    updatedItems,

            });

            updateLoading(
                100,
                "Finalizando..."
            );

            setFiles({});

            setLoadingModal({

                open: true,

                success: true,

                progress: 100,

                title: "Portfólio",

                message:
                    "Alterações salvas com sucesso.",

            });

            showToast(
                "Portfólio salvo com sucesso!",
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
                "Erro ao salvar o portfólio.",
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

    const items = Array.from(

        { length: 4 },

        (_, index) =>

            data.items[index] || {

                id: String(index + 1),

                title: "",

                imageUrl: "",

                imageStoragePath: "",

            }

    );

    return (

        <>

            <section className="site-portfolio">

                <div className="site-portfolio__top">

                    <button

                        className="site-portfolio__back"

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

                            Portfólio

                        </h2>

                        <p>

                            Gerencie a seção de portfólio exibida na página inicial.

                        </p>

                    </div>

                </div>

                <div className="site-portfolio__card">

                    <h3>

                        Informações da Seção

                    </h3>

                    <div className="site-portfolio__field">

                        <label>

                            Texto Superior

                        </label>

                        <input
                            value={data.eyebrow}
                            onChange={(event) =>
                                setData({

                                    ...data,

                                    eyebrow:
                                        event.target.value,

                                })
                            }
                        />

                    </div>

                    <div className="site-portfolio__field">

                        <label>

                            Título

                        </label>

                        <textarea
                            value={data.title}
                            onChange={(event) =>
                                setData({

                                    ...data,

                                    title:
                                        event.target.value,

                                })
                            }
                        />

                    </div>

                    <div className="site-portfolio__field">

                        <label>

                            Descrição

                        </label>

                        <textarea
                            value={data.description}
                            onChange={(event) =>
                                setData({

                                    ...data,

                                    description:
                                        event.target.value,

                                })
                            }
                        />

                    </div>

                </div>

                {items.map((item, index) => (

                    <div
                        key={index}
                        className="site-portfolio__card"
                    >

                        <h3>

                            Foto {index + 1}

                        </h3>

                        <button

                            type="button"

                            className="site-portfolio__upload"

                            onClick={() =>
                                fileInputs.current[index]?.click()
                            }

                        >

                            <FolderOpen size={18} />

                            Escolher imagem

                        </button>

                        <input

                            ref={(element) => {

                                fileInputs.current[index] =
                                    element;

                            }}

                            hidden

                            type="file"

                            accept="image/*"

                            onChange={(event) => {

                                const file =
                                    event.target.files?.[0];

                                if (!file) return;

                                setFiles((current) => ({

                                    ...current,

                                    [index]: file,

                                }));

                                const updatedItems =
                                    [...items];

                                updatedItems[index] = {

                                    ...item,

                                    imageUrl:
                                        URL.createObjectURL(file),

                                };

                                setData({

                                    ...data,

                                    items: updatedItems,

                                });

                            }}

                        />

                        {item.imageUrl && (

                            <div className="site-portfolio__preview">

                                <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                />

                            </div>

                        )}

                        <div className="site-portfolio__field">

                            <label>

                                Título

                            </label>

                            <input
                                value={item.title}
                                onChange={(event) => {

                                    const updatedItems =
                                        [...items];

                                    updatedItems[index] = {

                                        ...item,

                                        title:
                                            event.target.value,

                                    };

                                    setData({

                                        ...data,

                                        items: updatedItems,

                                    });

                                }}
                            />

                        </div>

                    </div>

                ))}

                <div className="site-portfolio__actions">

                    <button

                        className="site-portfolio__cancel"

                        onClick={() =>
                            navigate("/admin/site")
                        }

                    >

                        Cancelar

                    </button>

                    <button
                        className="site-portfolio__save"
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

export default SitePortfolio;