import "./SiteExperiences.css";

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
    saveSiteExperiences,
    subscribeSiteExperiences,
} from "../../services/firebase/siteExperiences";

import {
    subscribeEventCategories,
} from "../../services/firebase/eventCategory";

import {
    deleteFile,
    uploadSiteExperienceImage,
} from "../../services/firebase/storageService";

import type {
    EventCategory,
} from "../../services/firebase/eventCategory";

import type {
    SiteExperiences as SiteExperiencesType,
} from "../../types/siteExperiences";

function SiteExperiences() {

    const navigate = useNavigate();

    const { showToast } = useToast();

    const [isSaving, setIsSaving] =
        useState(false);

    const [files, setFiles] =
        useState<Record<number, File>>({});

    const [loadingModal, setLoadingModal] =
        useState({

            open: false,

            success: false,

            progress: 0,

            title: "",

            message: "",

        });

    const [categories, setCategories] =
        useState<EventCategory[]>([]);

    const [data, setData] =
        useState<SiteExperiencesType>({
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
            subscribeSiteExperiences((hero) => {

                if (!hero) return;

                setData(hero);

            });

        return unsubscribe;

    }, []);

    useEffect(() => {

        const unsubscribe =
            subscribeEventCategories(
                setCategories
            );

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

            title: "Salvando Experiências",

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

                const file =
                    files[index];

                if (!file) continue;

                updateLoading(

                    25 + (index * 15),

                    `Enviando imagem ${
                        index + 1
                    }...`

                );

                const currentItem =
                    updatedItems[index];

                if (
                    !currentItem
                ) {

                    continue;

                }

                if (
                    currentItem.imageStoragePath
                ) {

                    await deleteFile(
                        currentItem.imageStoragePath
                    );

                }

                const upload =

                    await uploadSiteExperienceImage(

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

            await saveSiteExperiences({

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

            setLoadingModal({

                open: true,

                success: true,

                progress: 100,

                title: "Experiências",

                message:
                    "Alterações salvas com sucesso.",

            });

            showToast(

                "Experiências salvas com sucesso!",

                "success"

            );

            setFiles({});

            setTimeout(() => {

                setLoadingModal((current) => ({

                    ...current,

                    open: false,

                }));

            }, 900);

        } catch (error) {

            console.error(error);

            showToast(
                "Erro ao salvar as experiências.",
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

                title: "",

                description: "",

                categoryId: "",

                imageUrl: "",

                imageStoragePath: "",

            }

    );

    return (

        <>

            <section className="site-experiences">

                <div className="site-experiences__top">

                    <button
                        className="site-experiences__back"
                        onClick={() =>
                            navigate("/admin/site")
                        }
                    >

                        <ArrowLeft size={18} />

                        <span>Voltar</span>

                    </button>

                    <div>

                        <h2>Experiências</h2>

                        <p>
                            Gerencie a seção de experiências exibida na página inicial.
                        </p>

                    </div>

                </div>

                <div className="site-experiences__card">

                    <h3>Informações da Seção</h3>

                    <div className="site-experiences__field">

                        <label>Texto Superior</label>

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

                    <div className="site-experiences__field">

                        <label>Título</label>

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

                    <div className="site-experiences__field">

                        <label>Descrição</label>

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
                        className="site-experiences__card"
                    >

                        <h3>

                            Card {index + 1}

                        </h3>

                        <button

                            type="button"

                            className="site-experiences__upload"

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

                            type="file"

                            hidden

                            accept="image/*"

                            onChange={(event) => {

                                const file =
                                    event.target.files?.[0];

                                if (!file) return;

                                setFiles((current) => ({

                                    ...current,

                                    [index]: file,

                                }));

                                const updatedItems = [...items];

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

                            <div className="site-experiences__preview">

                                <img
                                    src={item.imageUrl}
                                    alt={item.title || `Experiência ${index + 1}`}
                                />

                            </div>

                        )}

                        <div className="site-experiences__field">

                            <label>Título</label>

                            <input
                                value={item.title}
                                onChange={(event) => {

                                    const updatedItems = [...items];

                                    updatedItems[index] = {

                                        ...item,

                                        title: event.target.value,

                                    };

                                    setData({

                                        ...data,

                                        items: updatedItems,

                                    });

                                }}
                            />

                        </div>

                        <div className="site-experiences__field">

                            <label>Descrição</label>

                            <textarea
                                value={item.description}
                                onChange={(event) => {

                                    const updatedItems = [...items];

                                    updatedItems[index] = {

                                        ...item,

                                        description: event.target.value,

                                    };

                                    setData({

                                        ...data,

                                        items: updatedItems,

                                    });

                                }}
                            />

                        </div>

                        <div className="site-experiences__field">

                            <label>Categoria</label>

                            <select
                                value={
                                    item.categoryId ??
                                    categories.find(
                                        (category) =>
                                            category.name === item.categoryName
                                    )?.id ??
                                    ""
                                }
                                onChange={(event) => {

                                    const updatedItems = [...items];

                                    const selectedCategory =
                                        categories.find(
                                            (category) =>
                                                category.id === event.target.value
                                        );

                                    updatedItems[index] = {

                                        ...item,

                                        categoryId: selectedCategory?.id,

                                        categoryName: selectedCategory?.name ?? "",

                                    };

                                    setData({

                                        ...data,

                                        items: updatedItems,

                                    });

                                }}
                            >

                                <option value="">

                                    Selecione uma categoria

                                </option>

                                {categories.map((category) => (

                                    <option
                                        key={category.id}
                                        value={category.id}
                                    >

                                        {category.name}

                                    </option>

                                ))}

                            </select>

                        </div>

                    </div>

                ))}

                <div className="site-experiences__actions">

                    <button
                        className="site-experiences__cancel"
                        onClick={() =>
                            navigate("/admin/site")
                        }
                    >

                        Cancelar

                    </button>

                    <button
                        className="site-experiences__save"
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

export default SiteExperiences;
