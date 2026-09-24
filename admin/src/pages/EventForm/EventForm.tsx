import "./EventForm.css";
import "../../styles/albumFileControls.css";

import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    createAlbumDocument,
    updateAlbum,
} from "../../services/firebase/eventAlbum";

import {
    uploadAlbumFile,
} from "../../services/firebase/storageService";

import type {
    Album,
    AlbumPhoto,
} from "../../types/eventAlbum";

import {
    ArrowLeft,
    FolderOpen,
    HardDrive,
    MonitorUp,
    Save,
    Trash2,
} from "lucide-react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    initializeGoogleAuth,
    requestAccessToken,
    getAccessToken,
} from "../../services/google/picker";

import {
    copyDriveFile,
    uploadEventFileToDrive,
    copyPickerFileToDrive,
} from "../../services/api/google";
import { importExternalImage } from "../../services/api/media";

import LoadingModal from "../../components/LoadingModal/LoadingModal";
import { useToast } from "../../contexts/ToastContext";
import PhotoUploadDropZone from "../../components/PhotoUploadDropZone/PhotoUploadDropZone";
import SaveToDriveModal from "../../components/SaveToDriveModal/SaveToDriveModal";
import PhotoViewer from "../../components/PhotoViewer/PhotoViewer";
import SortablePhotoGrid from "../../components/SortablePhotoGrid/SortablePhotoGrid";
import createAlbumPhotos from "../../utils/createAlbumPhotos";
import { withUniqueAlbumPhotoNames } from "../../utils/uniqueFileName";

import {
    getEventCategory,
    resolveEventCategory,
} from "../../services/firebase/eventCategory";

import type {
    EventCategory,
} from "../../services/firebase/eventCategory";

const STORAGE_KEY = "feed-form";

const EventForm = () => {


const navigate = useNavigate();
const { showToast } = useToast();

const { categorySlug } = useParams();


const [album, setAlbum] = useState<Album>({

    name: "",
    description: "",

    category: "",

    status: "published",

    hasVideo: false,

    coverPhoto: undefined,

    photos: [],

    videos: [],

    categories: [],
});

const [photoPreview, setPhotoPreview] = useState<
    | { type: "general"; index: number }
    | { type: "category"; categoryId: string; index: number }
    | null
>(null);

const previewPhotos = photoPreview?.type === "general"
    ? album.photos
    : photoPreview?.type === "category"
        ? album.categories.find((category) => category.id === photoPreview.categoryId)?.photos
        : undefined;

useEffect(() => {
    if (photoPreview && !previewPhotos?.length) setPhotoPreview(null);
}, [photoPreview, previewPhotos]);

const maxCategories = album.hasVideo ? 2 : 3;


const photosInputRef = useRef<HTMLInputElement>(null);
const videoInputRef = useRef<HTMLInputElement>(null);


const coverInputRef =
    useRef<HTMLInputElement>(null);

const [isSaving, setIsSaving] = useState(false);

const [resolvedCategory, setResolvedCategory] =
    useState<EventCategory | null>(null);

const [resolvedCategoryPath, setResolvedCategoryPath] =
    useState<string | null>(null);

const [categoryLoadState, setCategoryLoadState] = useState<
    "loading" | "ready" | "error"
>("loading");

const [hydratedCategoryPath, setHydratedCategoryPath] =
    useState<string | null>(null);

const [showSaveToDriveModal, setShowSaveToDriveModal] =
    useState(false);

const [loadingModal, setLoadingModal] =
    useState({

        open: false,

        success: false,

        progress: 0,

       title: "Criando evento",

        message: "Preparando...",

    });

useEffect(() => {

    if (!categorySlug) {
        setResolvedCategoryPath(null);
        setCategoryLoadState("error");
        return;
    }

    let cancelled = false;

    const loadCategory = async () => {
        try {
            const identity = await resolveEventCategory(categorySlug);
            const category = await getEventCategory(identity.categoryId);

            if (cancelled) return;

            if (!category) {
                setCategoryLoadState("error");
                return;
            }

            const canonicalCategory: EventCategory = {
                ...category,
                id: identity.categoryId,
                slug: identity.canonicalSlug,
            };

            setResolvedCategory(canonicalCategory);
            setResolvedCategoryPath(categorySlug);
            setCategoryLoadState("ready");

            if (!identity.isCanonical) {
                navigate(
                    `/eventos/${identity.canonicalSlug}/novo`,
                    { replace: true },
                );
            }
        } catch {
            if (!cancelled) {
                setResolvedCategory(null);
                setResolvedCategoryPath(categorySlug);
                setCategoryLoadState("error");
            }
        }
    };

    void loadCategory();

    return () => {
        cancelled = true;
    };

}, [categorySlug, navigate]);


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

type EventFileItem =
    | Album["photos"][number]
    | Album["videos"][number];

const needsEventFileProcessing = (item: EventFileItem) => Boolean(
    item.file || (
        item.source === "drive" && item.storagePath && item.driveId
    )
);

const processEventFile = async (
    item: EventFileItem,
    albumToSave: Album,
    categoryName: string,
    albumFolder: string,
    destinationFolder: string,
    saveToDrive: boolean,
) => {

    if (item.file) {

       

           if (saveToDrive) {

    const driveResult =
        await uploadEventFileToDrive({

            file: item.file,

            albumCategory: categoryName,

            albumName: album.name,

            folder: destinationFolder,

        });

        if (!albumToSave.driveFolderId) {

    albumToSave.driveFolderId =
        driveResult.driveFolderId;

}

item.driveFileId =
    driveResult.driveFileId;

}

        const result =
            await uploadAlbumFile(

                categoryName,

                albumFolder,

                `${destinationFolder}/${item.name}`,

                item.file

            );

        item.preview = result.url;

        item.storagePath = result.storagePath;

        delete item.file;

        return;

    }

    if (
    item.source === "drive" &&
    item.storagePath &&
    item.driveId
) {

    if (saveToDrive) {

        const token = getAccessToken();

        if (token) {

            const driveResult =

            await copyPickerFileToDrive({

                fileId: item.driveId,

                accessToken: token,

                albumCategory: categoryName,

                albumName: album.name,

                folder: destinationFolder,

            });

           item.driveFileId =
    driveResult.driveFileId;

        }

    }

    const result =
        await copyDriveFile({

            sourcePath: item.storagePath,

            destinationPath:
    `AlbumFeed/${album.category}/${albumFolder}/${destinationFolder}/${item.name}`,
        });

    item.preview = result.url;

    item.storagePath = result.path;

}

};

const handleAddCategory = () => {

    if (album.categories.length >= maxCategories) return;

    setAlbum((current) => ({

        ...current,

        categories: [

            ...current.categories,

            {

                id: crypto.randomUUID(),

                name: "",

                photos: [],

            },

        ],

    }));

};

const addPhotos = (files: File[]) => {
    const uploadedPhotos = createAlbumPhotos(files);

    if (uploadedPhotos.length === 0) return;

    setAlbum((current) => {
        const uniquePhotos = withUniqueAlbumPhotoNames(
            uploadedPhotos,
            current.photos.map((photo) => photo.name),
        );

        return {
            ...current,
            photos: [...current.photos, ...uniquePhotos],
        };
    });
};

const handlePhotosUpload = (
    event: React.ChangeEvent<HTMLInputElement>
) => {
    addPhotos(Array.from(event.target.files || []));
};

const isValidLocalImage = (file: unknown): file is File =>
    file instanceof File && file.size > 0 && file.type.startsWith("image/");

const hasPersistentImageReference = (item: AlbumPhoto) => {
    if (
        typeof item.storagePath !== "string" || !item.storagePath.trim() ||
        typeof item.preview !== "string" || !item.preview.trim()
    ) return false;

    try {
        const url = new URL(item.preview);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
};

const isValidCoverPhoto = (item: AlbumPhoto | null | undefined): boolean => {
    if (!item || typeof item !== "object") return false;

    // A supplied file takes precedence in the existing upload flow.
    if (item.file != null) return isValidLocalImage(item.file);

    return hasPersistentImageReference(item);
};

const isValidGeneralPhoto = (item: AlbumPhoto | null | undefined): boolean => {
    if (!isValidCoverPhoto(item) || !item) return false;
    if (isValidLocalImage(item.file)) return true;

    return item.source !== "drive" || (
        typeof item.driveId === "string" && item.driveId.trim().length > 0
    );
};

const validateEvent = (): boolean => {
    if (!album.name?.trim()) {
        showToast("Informe o nome do evento.", "warning");
        return false;
    }

    if (!isValidCoverPhoto(album.coverPhoto)) {
        showToast("Selecione uma capa para o evento.", "warning");
        return false;
    }

    if (!Array.isArray(album.photos) || !album.photos.some(isValidGeneralPhoto)) {
        showToast("Adicione pelo menos uma foto geral.", "warning");
        return false;
    }

    return true;
};

const handleCreateAlbum = () => {

    if (
        !resolvedCategory?.id ||
        album.category !== resolvedCategory.id
    ) return;

    if (!validateEvent()) {
        return;
    }

    setShowSaveToDriveModal(true);

};


const createAlbum = async (
    saveToDrive: boolean,
) => {

    if (
        isSaving ||
        !resolvedCategory?.id ||
        album.category !== resolvedCategory.id
    ) return;

    if (!validateEvent()) {
        return;
    }

    setIsSaving(true);

    setLoadingModal({

        open: true,

        success: false,

        progress: 0,

        title: "Criando álbum",

        message: "Preparando arquivos...",

    });

    try {

        updateLoading(
            5,
            "Criando documento do evento..."
        );

        // 1 - cria o documento e obtém o ID

        const {
            albumId,
            slug,
        } = await createAlbumDocument(album.name);

        updateLoading(
            15,
            "Documento criado."
        );

        /*
         * Fazemos uma cópia manual para preservar
         * os objetos File escolhidos pelo usuário.
         */

        const albumToSave: Album = {

            ...album,

            slug,

            coverPhoto: album.coverPhoto
                ? {
                    ...album.coverPhoto,
                }
                : undefined,

            photos: album.photos.map((photo) => ({
                ...photo,
            })),

            videos: album.videos.map((video) => ({
                ...video,
            })),

            categories: album.categories.map(
                (category) => ({

                    ...category,

                    photos: category.photos.map(
                        (photo) => ({
                            ...photo,
                        })
                    ),

                })
            ),

        };

        const albumFolder = albumToSave.name
            .trim()
            .replace(/[\\/:*?"<>|]/g, "-");

        const categoryName =
            resolvedCategory?.name ?? "";

        const totalFiles = Number(Boolean(albumToSave.coverPhoto?.file))
            + [
                ...albumToSave.photos,
                ...albumToSave.videos,
                ...albumToSave.categories.flatMap((category) => category.photos),
            ].filter(needsEventFileProcessing).length;
        let completedFiles = 0;

        const markFileCompleted = () => {
            if (totalFiles === 0) return;

            completedFiles += 1;
            updateLoading(
                Math.min(93, 20 + 73 * (completedFiles / totalFiles)),
                `Enviando arquivos — ${completedFiles} de ${totalFiles} concluídos`,
            );
        };

        
            /*
 * 2 - Capa
 */

updateLoading(
    20,
    `Enviando arquivos — 0 de ${totalFiles} concluídos`
);

if (albumToSave.coverPhoto?.file) {

    const coverFile =
        albumToSave.coverPhoto.file;

    if (saveToDrive) {

    const driveResult =
        await uploadEventFileToDrive({

            file: coverFile,

            albumCategory:
                categoryName,

            albumName:
                albumToSave.name,

            folder: "Capa",

        });

    if (!albumToSave.driveFolderId) {

    albumToSave.driveFolderId =
        driveResult.driveFolderId;

}

albumToSave.coverPhoto!.driveFileId =
    driveResult.driveFileId;

}

    const result =
    await uploadAlbumFile(

        categoryName,

        albumFolder,

        "Capa/capa.jpg",

        coverFile

    );

    albumToSave.coverPhoto = {

        ...albumToSave.coverPhoto,

        preview: result.url,

        storagePath:
            result.storagePath,

    };

    delete albumToSave.coverPhoto.file;

    markFileCompleted();

}
        /*
 * 3 - Fotos
 */

for (const photo of albumToSave.photos) {

    const needsProcessing = needsEventFileProcessing(photo);

    await processEventFile(
        photo,
        albumToSave,
        categoryName,
        albumFolder,
        "Fotos",
        saveToDrive
    );

    if (needsProcessing) markFileCompleted();

}
        /*
 * 4 - Vídeos
 */

for (const video of albumToSave.videos) {

    const needsProcessing = needsEventFileProcessing(video);

    await processEventFile(
        video,
        albumToSave,
        categoryName,
        albumFolder,
        "Vídeos",
        saveToDrive
    );

    if (needsProcessing) markFileCompleted();

}

/*
 * 5 - Fotos das categorias
 */

for (const category of albumToSave.categories) {

    const categoryName = category.name
        .trim()
        .replace(/[\\/:*?"<>|]/g, "-");

    for (const photo of category.photos) {

       const needsProcessing = needsEventFileProcessing(photo);

       await processEventFile(
            photo,
            albumToSave,
            categoryName,
            albumFolder,
            `Categorias/${categoryName}`,
            saveToDrive
        );

        if (needsProcessing) markFileCompleted();
    }

}

        /*
         * 6 - salva o documento final
         */

        updateLoading(
            93,
            "Salvando informações do evento..."
        );

        delete albumToSave.eventLocation;
        delete albumToSave.eventDate;
        delete albumToSave.eventTime;

        await updateAlbum(
            albumId,
            albumToSave
        );

        localStorage.removeItem(
            STORAGE_KEY
        );

        setLoadingModal((current) => ({

            ...current,

            success: true,

            progress: 100,

            message:
                "Evento criado com sucesso!",

        }));

        await new Promise((resolve) =>
            setTimeout(resolve, 900)
        );

        setLoadingModal((current) => ({

            ...current,

            open: false,

        }));

        await new Promise((resolve) =>
            setTimeout(resolve, 350)
        );

        if (resolvedCategory?.slug) {
            navigate(
                `/eventos/${resolvedCategory.slug}`,
                { replace: true },
            );
        }

    } catch (error) {

        console.error(
            "Erro ao criar evento:",
            error
        );

        setLoadingModal((current) => ({

            ...current,

            open: false,

        }));

    } finally {

        setIsSaving(false);

    }

};



const handleVideoUpload = (
    event: React.ChangeEvent<HTMLInputElement>
) => {

    const file = event.target.files?.[0];

    if (!file) return;

    setAlbum((current) => ({

        ...current,

        videos: [
            {
                id: crypto.randomUUID(),

                file,

                name: file.name,

                size: file.size,

                preview: URL.createObjectURL(file),

                source: "computer",
            },
        ],

    }));

};


const addCategoryPhotos = (categoryId: string, files: File[]) => {
    const uploadedPhotos = createAlbumPhotos(files);

    if (uploadedPhotos.length === 0) return;

    setAlbum((current) => ({

        ...current,

        categories: current.categories.map((category) =>

            category.id === categoryId
                ? (() => {
                    const uniquePhotos = withUniqueAlbumPhotoNames(
                        uploadedPhotos,
                        category.photos.map((photo) => photo.name),
                    );

                    return {

                    ...category,

                    photos: [

                        ...category.photos,

                        ...uniquePhotos,

                    ],

                    };
                })()
                : category

        ),

    }));
};

const handleCategoryPhotosUpload = (
    categoryId: string,
    event: React.ChangeEvent<HTMLInputElement>
) => {
    addCategoryPhotos(
        categoryId,
        Array.from(event.target.files || [])
    );
};


const handleCoverUpload = (
    event: React.ChangeEvent<HTMLInputElement>
) => {

    const file = event.target.files?.[0];

    if (!file) return;

    const coverPhoto: AlbumPhoto = {

        id: crypto.randomUUID(),

        file,

        preview: URL.createObjectURL(file),

        name: file.name,

        size: file.size,

        source: "computer",

    };

    setAlbum((current) => ({

        ...current,

        coverPhoto,

    }));

};


useEffect(() => {
    if (
        !categorySlug ||
        !resolvedCategory?.id ||
        resolvedCategoryPath !== categorySlug
    ) return;

    // Remove qualquer rascunho antigo que possa conter
    // previews sem os arquivos File reais.
    localStorage.removeItem(STORAGE_KEY);

    // O formulário de criação sempre começa limpo.
    setAlbum({
        name: "",
        description: "",
        category: resolvedCategory.id,
        status: "published",
        hasVideo: false,
        coverPhoto: undefined,
        photos: [],
        videos: [],
        categories: [],
    });

    setHydratedCategoryPath(categorySlug);

}, [categorySlug, resolvedCategory, resolvedCategoryPath]);


const handleBack = () => {
    if (resolvedCategory?.slug) {
        navigate(`/eventos/${resolvedCategory.slug}`);
    }
};

    if (
        categoryLoadState === "error" &&
        (!categorySlug || resolvedCategoryPath === categorySlug)
    ) {
        return (
            <section className="album-form">
                <h2>Categoria não encontrada.</h2>
                <p>Não foi possível iniciar a criação deste evento.</p>
            </section>
        );
    }

    if (
        categoryLoadState === "loading" ||
        resolvedCategoryPath !== categorySlug ||
        hydratedCategoryPath !== categorySlug ||
        !resolvedCategory
    ) {
        return (
            <section className="album-form">
                <p>Carregando categoria...</p>
            </section>
        );
    }

    return (

        <section className="album-form">

            <div className="album-form__top">

    <button
        className="album-form__back"
        onClick={handleBack}
    >

        <ArrowLeft size={18} />

        <span>Voltar</span>

    </button>

    <div className="album-form__title">

        <h2>Novo Evento</h2>

        <p>
            Cadastre um novo evento para o site.
        </p>

    </div>

</div>

            <div className="album-form__card">

                <h3>Informações</h3>

                <div className="album-form__grid">

                   <div
    className="album-form__field"
    style={{ gridColumn: "1 / -1" }}
>

                        <label>Nome do Evento</label>

                        <input
    type="text"
    placeholder="Ex.: Casamento Ana e Lucas"
    value={album.name}
    onChange={(event) =>
        setAlbum((current) => ({
            ...current,
            name: event.target.value,
        }))
    }
/>

                    </div>

                   

<div
    className="album-form__field"
    style={{ gridColumn: "1 / -1" }}
>

    <label>Categoria do Evento</label>

    <input
        type="text"
        value={resolvedCategory.name}
        readOnly
        aria-readonly="true"
    />

</div>
                    



                </div>


                

                <div className="album-form__field">

                    <label>Descrição</label>

                    <textarea
   placeholder="Descrição do evento..."
    value={album.description}
    onChange={(event) =>
        setAlbum((current) => ({
            ...current,
            description: event.target.value,
        }))
    }
/>

                </div>

            </div>

            <div className="album-form__card">

                <h3>Adicionar Fotos</h3>

                <PhotoUploadDropZone
                    className="album-form__upload"
                    onFiles={addPhotos}
                    onExternalImageUrl={importExternalImage}
                >

                    <>
    <input
        ref={photosInputRef}
        type="file"
        multiple
        accept="image/*"
        style={{ display: "none" }}
        onChange={handlePhotosUpload}
    />

    <button
        type="button"
        onClick={() => photosInputRef.current?.click()}
    >

        <MonitorUp size={28} />

        <span>Do Computador</span>

    </button>
</>
<button
    type="button"
    onClick={async () => {


    try {

       await initializeGoogleAuth((result) => {

   const drivePhoto = {
            id: crypto.randomUUID(),

            preview: result.storage.url,

            name: result.file.name,

            size: Number(result.file.size),

            driveId: result.file.id,

            storagePath: result.storage.path,

            source: "drive",
        } as Album["photos"][number];

   setAlbum((current) => ({
    ...current,
    photos: [
        ...current.photos,
        ...withUniqueAlbumPhotoNames(
            [drivePhoto],
            current.photos.map((photo) => photo.name),
        ),
    ],
}));

});


requestAccessToken();


    } catch (error) {

        console.error(error);

    }

}}
>

    <HardDrive size={28} />

    <span>Google Drive</span>

</button>

                </PhotoUploadDropZone>

              

<div className="album-form__upload-info">

   {album.photos.length === 0
    ? "Nenhuma foto adicionada."
    : `${album.photos.length} foto${album.photos.length > 1 ? "s" : ""} adicionada${album.photos.length > 1 ? "s" : ""}.`
}

</div>

{album.photos.length > 0 && (
    <div className="album-form__photo-scroll album-form__photo-scroll--general">
    <SortablePhotoGrid
        photos={album.photos}
        onPreview={(_photo, index) =>
            setPhotoPreview({ type: "general", index })
        }
        onReorder={(photos) =>
            setAlbum((current) => ({
                ...current,
                photos,
            }))
        }
        onRemove={(photoId) =>
            setAlbum((current) => ({
                ...current,
                photos: current.photos.filter(
                    (photo) => photo.id !== photoId
                ),
            }))
        }
    />
    </div>
)}

            </div>


            <div className="album-form__card">

    <div className="album-form__video-header">

        <div>
            <h3>Vídeo</h3>

            <p>
                Ative esta opção caso o evento também possua vídeo.
            </p>
        </div>

        <label className="album-form__switch">

            <input
                type="checkbox"
                checked={album.hasVideo}
                onChange={(event) =>
    setAlbum((current) => ({
        ...current,
        hasVideo: event.target.checked,
    }))
}
            />

            <span></span>

        </label>

    </div>

  {album.hasVideo && (

    <>

        <div className="album-form__video-options">

            <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                style={{ display: "none" }}
                onChange={handleVideoUpload}
            />

            <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
            >

                <MonitorUp size={28} />

                <span>Do Computador</span>

            </button>

           <button
    type="button"
    onClick={async () => {

        try {

            await initializeGoogleAuth(
                (result) => {

                    setAlbum((current) => ({

                        ...current,

                        videos: [

                            ...current.videos,

                            {

                                id: crypto.randomUUID(),

                                preview:
                                    result.storage.url,

                                name:
                                    result.file.name,

                                size: Number(
                                    result.file.size
                                ),

                                driveId:
                                    result.file.id,

                                storagePath:
                                    result.storage.path,

                                source: "drive",

                            },

                        ],

                    }));

                }
            );

            requestAccessToken();

        } catch (error) {

            console.error(error);

        }

    }}
>

    <HardDrive size={28} />

    <span>Google Drive</span>

</button>

        </div>

        <div className="album-form__upload-info">

            {album.videos.length === 0
                ? "Nenhum vídeo adicionado."
                : `${album.videos.length} vídeo${album.videos.length > 1 ? "s" : ""} adicionado${album.videos.length > 1 ? "s" : ""}.`
            }

        </div>

        {album.videos.length > 0 && (

            <div className="album-form__photos">

                {album.videos.map((video) => (

                    <div
                        key={video.id}
                        className="album-form__photo"
                    >

                        <button
                            type="button"
                            className="album-form__photo-remove"
                            onClick={() =>
                                setAlbum((current) => ({
                                    ...current,
                                    videos: [],
                                }))
                            }
                        >

                            ×

                        </button>

                        <video
                            src={video.preview}
                            controls
                        />

                        <span>

                            {video.name}

                        </span>

                    </div>

                ))}

            </div>

        )}

    </>

)}
</div>




<div className="album-form__card">

    <div className="album-form__categories-header">

        <div>

            <h3>Categorias</h3>

            <p>
               Organize as fotografias do evento em categorias.
            </p>

        </div>

        <button
            className="album-form__add-category"
            onClick={handleAddCategory}
            disabled={album.categories.length >= maxCategories}
        >

            + Adicionar Categoria

        </button>

    </div>

    {album.categories.length === 0 && (

        <div className="album-form__empty">

            Nenhuma categoria adicionada.

        </div>

    )}

    {album.categories.map((category, index) => (

        <div
    key={index}
    className="album-form__category-card"
>

    <div className="album-form__category-top">

    <h4>

        Categoria {index + 1}

    </h4>

    <button
        className="album-form__remove-category"
        onClick={() => {

            setAlbum((current) => ({
    ...current,
    categories: current.categories.filter((_, i) => i !== index),
}));

        }}
    >

        <Trash2 size={18} />

    </button>

</div>

    <div className="album-form__field">

        <label>Nome da categoria</label>

        <input
            type="text"
            placeholder="Ex.: Cerimônia"
            value={category.name}
            onChange={(event) => {

                setAlbum((current) => ({

    ...current,

    categories: current.categories.map((item, i) =>

        i === index
            ? {
                  ...item,
                  name: event.target.value,
              }
            : item

    ),

}));

            }}
        />

    </div>

    <PhotoUploadDropZone
        className="album-form__category-upload"
        onFiles={(files) => addCategoryPhotos(category.id, files)}
        onExternalImageUrl={importExternalImage}
    >

       <input
    type="file"
    accept="image/*"
    multiple
    style={{ display: "none" }}
    id={`category-upload-${category.id}`}
    onChange={(event) =>
        handleCategoryPhotosUpload(
            category.id,
            event
        )
    }
/>

<button
    type="button"
    onClick={() =>

        document
            .getElementById(
                `category-upload-${category.id}`
            )
            ?.click()

    }
>

    <MonitorUp size={28} />

    <span>Do Computador</span>

</button>

       <button
    type="button"
    onClick={async () => {

        try {

            await initializeGoogleAuth(
                (result) => {

                    setAlbum((current) => ({

                        ...current,

                        categories: current.categories.map((item) =>

                            item.id === category.id
                                ? (() => {
                                    const drivePhoto = {
                                        id: crypto.randomUUID(),
                                        preview: result.storage.url,
                                        name: result.file.name,
                                        size: Number(result.file.size),
                                        driveId: result.file.id,
                                        storagePath: result.storage.path,
                                        source: "drive",
                                    } as Album["photos"][number];

                                    return {

                                    ...item,

                                    photos: [

                                        ...item.photos,

                                        ...withUniqueAlbumPhotoNames(
                                            [drivePhoto],
                                            item.photos.map((photo) => photo.name),
                                        ),

                                    ],

                                    };
                                })()
                                : item

                        ),

                    }));

                }
            );

            requestAccessToken();

        } catch (error) {

            console.error(error);

        }

    }}
>

    <HardDrive size={28} />

    <span>Google Drive</span>

</button>

    </PhotoUploadDropZone>

   <div className="album-form__category-info">

    {category.photos.length === 0
        ? "Nenhuma foto adicionada."
        : `${category.photos.length} foto${category.photos.length > 1 ? "s" : ""} adicionada${category.photos.length > 1 ? "s" : ""}.`
    }

</div>

{category.photos.length > 0 && (
    <div className="album-form__photo-scroll album-form__photo-scroll--category">
    <SortablePhotoGrid
        photos={category.photos}
        onPreview={(_photo, index) =>
            setPhotoPreview({ type: "category", categoryId: category.id, index })
        }
        onReorder={(photos) =>
            setAlbum((current) => ({
                ...current,
                categories: current.categories.map((item) =>
                    item.id === category.id
                        ? { ...item, photos }
                        : item
                ),
            }))
        }
        onRemove={(photoId) =>
            setAlbum((current) => ({
                ...current,
                categories: current.categories.map((item) =>
                    item.id === category.id
                        ? {
                            ...item,
                            photos: item.photos.filter(
                                (photo) => photo.id !== photoId
                            ),
                        }
                        : item
                ),
            }))
        }
    />
    </div>
)}

</div>

    ))}

</div>

            <div className="album-form__card">

                <h3>Configurações</h3>

                <div className="album-form__grid">

                    <div className="album-form__field">

                        <label>Status</label>

                        <select
    value={album.status}
    onChange={(event) =>
        setAlbum((current) => ({
            ...current,
            status: event.target.value as
                | "published"
                | "draft"
                | "hidden",
        }))
    }
>

    <option value="published">
        Publicado
    </option>

    <option value="draft">
        Rascunho
    </option>

    <option value="hidden">
        Oculto
    </option>

</select>

                    </div>

                    <div className="album-form__field">

    <label>Capa do Evento</label>

     <button
        type="button"
        className="album-form__cover"
        onClick={() =>
            coverInputRef.current?.click()
        }
    >

        <FolderOpen size={20} />

        {album.coverPhoto
            ? "Alterar capa"
            : "Escolher capa"}

    </button>

    <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleCoverUpload}
    />

    {album.coverPhoto && (

        <div className="album-form__cover-preview">

            <img
                src={album.coverPhoto.preview}
                alt={album.coverPhoto.name}
            />

            <span>

                {album.coverPhoto.name}

            </span>

        </div>

    )}


   

</div>

                </div>

            </div>

            <div className="album-form__actions">

                <button
                    className="album-form__cancel"
                    onClick={handleBack}
                >

                    Cancelar

                </button>

              <button
    type="button"
    className="album-form__save"
    onClick={handleCreateAlbum}
    disabled={isSaving || !resolvedCategory.id}
>

                   <Save size={18} />

{isSaving
    ? "Criando..."
    : "Criar Evento"}

                </button>

            </div>



<SaveToDriveModal
    open={showSaveToDriveModal}
    onCancel={() => {

        setShowSaveToDriveModal(false);

    }}
    onNo={async () => {

        setShowSaveToDriveModal(false);

        await createAlbum(false);

    }}
    onYes={async () => {

        setShowSaveToDriveModal(false);

        await createAlbum(true);

    }}
/>


{photoPreview && previewPhotos && previewPhotos.length > 0 && (
    <PhotoViewer
        key={JSON.stringify(photoPreview)}
        photos={previewPhotos}
        initialIndex={photoPreview.index}
        onClose={() => setPhotoPreview(null)}
    />
)}

<LoadingModal
    open={loadingModal.open}
    progress={loadingModal.progress}
    title={loadingModal.title}
    message={loadingModal.message}
    success={loadingModal.success}
/>
            

        </section>

    );

};

export default EventForm;
