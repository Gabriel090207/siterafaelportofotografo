import "./EditEvent.css";

import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    updateAlbumDetails,
    updateAlbumIdentity,
    getEventAlbum,
    resolveEventAlbum,
} from "../../services/firebase/eventAlbum";

import {
    uploadAlbumFile,
    deleteFile,

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
    moveStorageFolder,
    uploadEventFileToDrive,
    copyPickerFileToDrive,
    deleteDriveFile,
    renameDriveFolder,
} from "../../services/api/google";
import { importExternalImage } from "../../services/api/media";

import LoadingModal from "../../components/LoadingModal/LoadingModal";
import PhotoUploadDropZone from "../../components/PhotoUploadDropZone/PhotoUploadDropZone";
import SaveToDriveModal from "../../components/SaveToDriveModal/SaveToDriveModal";
import SortablePhotoGrid from "../../components/SortablePhotoGrid/SortablePhotoGrid";
import createAlbumPhotos from "../../utils/createAlbumPhotos";

import {
    subscribeEventCategories,
} from "../../services/firebase/eventCategory";

import type {
    EventCategory,
} from "../../services/firebase/eventCategory";

const EditEvent = () => {


const navigate = useNavigate();


const {
    categorySlug,
    albumSlug,
    categoryIdentifier,
    albumIdentifier,
} = useParams();

const requestedCategory = categorySlug ?? categoryIdentifier;
const requestedAlbum = albumSlug ?? albumIdentifier;

const [resolvedIdentity, setResolvedIdentity] = useState<{
    categoryId: string;
    albumId: string;
    canonicalCategorySlug: string;
    canonicalAlbumSlug: string;
} | null>(null);

const albumId = resolvedIdentity?.albumId;


useEffect(() => {

    const unsubscribe =
        subscribeEventCategories(
            setEventCategories
        );

    return unsubscribe;

}, []);


useEffect(() => {

    if (!requestedCategory || !requestedAlbum) return;

    let cancelled = false;

    const resolveIdentity = async () => {
        const identity = await resolveEventAlbum(
            requestedCategory,
            requestedAlbum,
        );

        if (cancelled) return;

        setResolvedIdentity(identity);

        if (!identity.isCanonical) {
            navigate(
                `/eventos/${identity.canonicalCategorySlug}/${identity.canonicalAlbumSlug}`,
                { replace: true },
            );
        }
    };

    void resolveIdentity();

    return () => {
        cancelled = true;
    };

}, [navigate, requestedAlbum, requestedCategory]);


useEffect(() => {

    if (!albumId) return;


    const loadAlbum = async () => {

    const data =
        await getEventAlbum(albumId);

    if (data) {

        setAlbum(data);

setOriginalAlbum(
    structuredClone(data)
);

    }

};


    void loadAlbum();


}, [albumId]);

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

const [originalAlbum, setOriginalAlbum] =
    useState<Album | null>(null);

const maxCategories = album.hasVideo ? 2 : 3;


const photosInputRef = useRef<HTMLInputElement>(null);
const videoInputRef = useRef<HTMLInputElement>(null);


const coverInputRef =
    useRef<HTMLInputElement>(null);

const [isSaving, setIsSaving] = useState(false);

const [eventCategories, setEventCategories] =
    useState<EventCategory[]>([]);

const [showSaveToDriveModal, setShowSaveToDriveModal] =
    useState(false);

const [loadingModal, setLoadingModal] = useState({

    open: false,

    success: false,

    progress: 0,

    title: "Salvando alterações",

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

const handleSaveEvent = () => {

    setShowSaveToDriveModal(true);

};


type EventFileItem =
    | Album["photos"][number]
    | Album["videos"][number];

const processEventFile = async (
    item: EventFileItem,
    albumToSave: Album,
    categoryName: string,
    albumFolder: string,
    destinationFolder: string,
    saveToDrive: boolean,
) => {
    // Arquivo vindo do computador
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

      const result = await uploadAlbumFile(

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

    // Arquivo vindo do Google Drive
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

if (!albumToSave.driveFolderId) {

    albumToSave.driveFolderId =
        driveResult.driveFolderId;

}

item.driveFileId =
    driveResult.driveFileId;

        }

    }

        const result = await copyDriveFile({

            sourcePath: item.storagePath,

            destinationPath:
                `AlbumFeed/${categoryName}/${albumFolder}/${destinationFolder}/${item.name}`

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

    setAlbum((current) => ({
        ...current,
        photos: [...current.photos, ...uploadedPhotos],
    }));
};

const handlePhotosUpload = (
    event: React.ChangeEvent<HTMLInputElement>
) => {
    addPhotos(Array.from(event.target.files || []));
};

const updateMovedFilesReferences = async (
    albumData: Album,
    oldFolder: string,
    newFolder: string,
    movedFiles: Map<string, string>
) => {


    const updateFileReference = async (
        file: any
    ) => {

        if (!file.storagePath)
            return;


        const newPath =
            file.storagePath.replace(
                oldFolder,
                newFolder
            );


        file.storagePath = newPath;


        file.preview =
            movedFiles.get(newPath)
            ?? file.preview;

    };


    if (albumData.coverPhoto) {

        await updateFileReference(
            albumData.coverPhoto
        );

    }


    for (const photo of albumData.photos) {

        await updateFileReference(photo);

    }


    for (const video of albumData.videos) {

        await updateFileReference(video);

    }


    for (const category of albumData.categories) {

        for (const photo of category.photos) {

            await updateFileReference(photo);

        }

    }

};



const handleUpdateAlbum = async (
    saveToDrive: boolean
) => {

    if (!albumId) return;


    try {

        setIsSaving(true);


        setLoadingModal({

    open: true,

    success: false,

    progress: 0,

    title: "Salvando alterações",

    message: "Preparando arquivos...",

});


        const albumToSave: Album = {
            

    ...album,

    coverPhoto: album.coverPhoto
        ? {
            ...album.coverPhoto,
        }
        : undefined,

    photos: album.photos.map(photo => ({
        ...photo,
    })),

    videos: album.videos.map(video => ({
        ...video,
    })),

    categories: album.categories.map(category => ({

        ...category,

        photos: category.photos.map(photo => ({
            ...photo,
        })),

    })),

};

const mustUpdateIdentity =
    !originalAlbum?.slug ||
    album.name.trim() !== originalAlbum.name.trim();

    
updateLoading(
    10,
    "Preparando alterações..."
);

    const removedPhotos =
    originalAlbum?.photos?.filter(

        oldPhoto =>

            !albumToSave.photos.some(

                newPhoto =>
                    newPhoto.id === oldPhoto.id

            )

    ) ?? [];


    
    const removedVideos =
    originalAlbum?.videos?.filter(
        oldVideo =>
            !albumToSave.videos.some(
                newVideo =>
                    newVideo.id === oldVideo.id
            )
    ) ?? [];

const removedCategoryPhotos =
    originalAlbum?.categories.flatMap(category =>

        category.photos.filter(oldPhoto => {

            const currentCategory =
                albumToSave.categories.find(
                    item => item.id === category.id
                );

            if (!currentCategory) {
                return true;
            }

            return !currentCategory.photos.some(
                newPhoto =>
                    newPhoto.id === oldPhoto.id
            );

        })

    ) ?? [];


    updateLoading(
    20,
    "Removendo arquivos antigos..."
);



    console.log(
    "Fotos removidas:",
    removedPhotos
);

console.log(
    "Vídeos removidos:",
    removedVideos
);

console.log(
    "Fotos das categorias removidas:",
    removedCategoryPhotos
);

// Fotos

for (const photo of removedPhotos) {

    if (photo.storagePath) {

        await deleteFile(
            photo.storagePath
        );

    }

    if (
    saveToDrive &&
    photo.driveFileId
) {

    await deleteDriveFile({

        fileId: photo.driveFileId,

    });

}

}

// Vídeos

for (const video of removedVideos) {

    if (video.storagePath) {

        await deleteFile(
            video.storagePath
        );

    }

  if (
    saveToDrive &&
    video.driveFileId
) {

    await deleteDriveFile({

        fileId: video.driveFileId,

    });

}

}

// Categorias

for (const photo of removedCategoryPhotos) {

    if (photo.storagePath) {

        await deleteFile(
            photo.storagePath
        );

    }

   if (
    saveToDrive &&
    photo.driveFileId
) {

    await deleteDriveFile({

        fileId: photo.driveFileId,

    });

}

}

        const originalFolder =
    originalAlbum?.name
        ?.trim()
        .replace(/[\\/:*?"<>|]/g, "-");

        const originalCategory =
    originalAlbum?.category;


const currentCategory =
    albumToSave.category;


    const categoryChanged =
    originalCategory &&
    originalCategory !== currentCategory;

const albumFolder =
    albumToSave.name
        .trim()
        .replace(/[\\/:*?"<>|]/g, "-");


const selectedCategory =
    eventCategories.find(
        item => item.id === albumToSave.category
    );

const categoryName =
    selectedCategory?.name ?? "";


const originalCategoryName =
    eventCategories.find(
        item => item.id === originalAlbum?.category
    )?.name ?? "";

const currentCategoryName =
    eventCategories.find(
        item => item.id === albumToSave.category
    )?.name ?? "";

       const folderChanged =
    originalFolder &&
    (
        originalFolder !== albumFolder ||
        categoryChanged
    );


if (folderChanged) {


    if (
    saveToDrive &&
    albumToSave.driveFolderId
) {

    await renameDriveFolder({

        folderId: albumToSave.driveFolderId,

        newName: albumFolder,

    });

}

    console.log(
        "MOVENDO PASTA:",
        `AlbumFeed/${originalFolder}`,
        "=>",
        `AlbumFeed/${albumFolder}`
    );


    console.log("ANTES DO MOVE");

    const oldStoragePath =
    `AlbumFeed/${originalCategoryName}/${originalFolder}`;


const newStoragePath =
    `AlbumFeed/${currentCategoryName}/${albumFolder}`;


const moveResult = await moveStorageFolder({

    sourceFolder: oldStoragePath,

    destinationFolder: newStoragePath,

});

    console.log("MOVE RESULT:", moveResult);


    const movedFiles = new Map<string, string>(

    moveResult.files.map(
        (file: {
            oldPath: string;
            newPath: string;
            url: string;
        }) => [

            file.newPath,

            file.url,

        ]
    )

);


    await updateMovedFilesReferences(

    albumToSave,

    oldStoragePath,

    newStoragePath,

    movedFiles

);

console.log("albumToSave:", albumToSave);


updateLoading(
    35,
    "Atualizando estrutura..."
);


}


if (
    saveToDrive &&
    albumToSave.coverPhoto?.file &&
    originalAlbum?.coverPhoto?.driveFileId
) {

    await deleteDriveFile({

        fileId:
            originalAlbum.coverPhoto.driveFileId,

    });

}

        if (albumToSave.coverPhoto?.file) {

    const coverFile =
        albumToSave.coverPhoto.file;

if (saveToDrive) {

        const driveResult =
    await uploadEventFileToDrive({

        file: coverFile,

        albumCategory: categoryName,

        albumName: album.name,

        folder: "Capa",

    });

if (!albumToSave.driveFolderId) {

        albumToSave.driveFolderId =
            driveResult.driveFolderId;

    }

    albumToSave.coverPhoto.driveFileId =
        driveResult.driveFileId;

}
   

   const result = await uploadAlbumFile(
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

}


updateLoading(
    45,
    "Enviando capa..."
);

// =====================
// Upload das fotos
// =====================

for (const photo of albumToSave.photos) {

await processEventFile(
    photo,
    albumToSave,
    categoryName,
    albumFolder,
    "Fotos",
    saveToDrive,
);

}

updateLoading(
    65,
    "Enviando fotos..."
);

// =====================
// Upload dos vídeos
// =====================

for (const video of albumToSave.videos) {

await processEventFile(
    video,
    albumToSave,
    categoryName,
    albumFolder,
    "Vídeos",
    saveToDrive,
);

}


updateLoading(
    80,
    "Enviando vídeos..."
);
// =====================
// Upload das fotos das categorias
// =====================

for (const category of albumToSave.categories) {

    const folderName =
        `Categorias/${category.name}`;

    for (const photo of category.photos) {

   await processEventFile(
    photo,
    albumToSave,
    categoryName,
    albumFolder,
    folderName,
    saveToDrive,
);

    }


    updateLoading(
    90,
    "Enviando categorias..."
);

}



updateLoading(
    95,
    "Salvando alterações..."
);

        let canonicalAlbumSlug = resolvedIdentity?.canonicalAlbumSlug;

        if (mustUpdateIdentity) {

            const identity = await updateAlbumIdentity(
                albumId,
                albumToSave.name,
            );

            canonicalAlbumSlug = identity.slug;

        }

        await updateAlbumDetails(
            albumId,
            albumToSave,
        );

setLoadingModal((current) => ({

    ...current,

    success: true,

    progress: 100,

    message: "Alterações salvas com sucesso!",

}));

await new Promise(resolve =>
    setTimeout(resolve, 900)
);

setLoadingModal((current) => ({

    ...current,

    open: false,

}));

await new Promise(resolve =>
    setTimeout(resolve, 300)
);

const canonicalCategorySlug = eventCategories.find(
    category => category.id === albumToSave.category
)?.slug ?? resolvedIdentity?.canonicalCategorySlug;

if (canonicalCategorySlug && canonicalAlbumSlug) {
    navigate(
        `/eventos/${canonicalCategorySlug}/${canonicalAlbumSlug}`,
        { replace: true },
    );
}

    } catch(error) {

        console.error(
            "Erro ao atualizar evento:",
            error
        );

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
                ? {

                    ...category,

                    photos: [

                        ...category.photos,

                        ...uploadedPhotos,

                    ],

                }
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



    return (

        <section className="album-form">

            <div className="album-form__top">

    <button
        className="album-form__back"
        onClick={() =>
    navigate(`/eventos/${resolvedIdentity?.canonicalCategorySlug ?? ""}`)
}
    >

        <ArrowLeft size={18} />

        <span>Voltar</span>

    </button>

    <div className="album-form__title">

        <h2>Editar Evento</h2>

        <p>
            Edite as informações e arquivos do evento.
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

    <select
        value={album.category ?? ""}
        onChange={(event) =>
            setAlbum((current) => ({
                ...current,
                category: event.target.value,
            }))
        }
    >

        <option value="">
            Selecione uma categoria
        </option>

        {eventCategories.map((category) => (

    <option
        key={category.id}
        value={category.id}
    >
        {category.name}
    </option>

))}

    </select>

</div>
                    
                    <div className="album-form__grid--three">

    <div className="album-form__field">

        <label>Data</label>

        <input
            type="date"
            value={album.eventDate ?? ""}
            onChange={(event) =>
                setAlbum(current => ({
                    ...current,
                    eventDate: event.target.value,
                }))
            }
        />

    </div>

    <div className="album-form__field">

        <label>Horário</label>

        <input
            type="time"
            value={album.eventTime ?? ""}
            onChange={(event) =>
                setAlbum(current => ({
                    ...current,
                    eventTime: event.target.value,
                }))
            }
        />

    </div>

    <div className="album-form__field">

        <label>Local</label>

        <input
            type="text"
            placeholder="Londrina - PR"
            value={album.eventLocation ?? ""}
            onChange={(event) =>
                setAlbum(current => ({
                    ...current,
                    eventLocation: event.target.value,
                }))
            }
        />

    </div>

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
                    onExternalImageUrl={async (url) => {
                        addPhotos([await importExternalImage(url)]);
                    }}
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

    console.log("0 - clicou");

    try {

       await initializeGoogleAuth((result) => {

   setAlbum((current) => ({

    ...current,

    photos: [

        ...current.photos,

        {
            id: crypto.randomUUID(),

            preview: result.storage.url,

            name: result.file.name,

            size: Number(result.file.size),

            driveId: result.file.id,

            storagePath: result.storage.path,

            source: "drive",
        },

    ],

}));

});

console.log("4 - auth inicializada");

requestAccessToken();

        console.log("5 - token solicitado");

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
    <SortablePhotoGrid
        photos={album.photos}
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
        onExternalImageUrl={async (url) => {
            addCategoryPhotos(
                category.id,
                [await importExternalImage(url)]
            );
        }}
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
                                ? {

                                    ...item,

                                    photos: [

                                        ...item.photos,

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

                                }
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
    <SortablePhotoGrid
        photos={category.photos}
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
                    onClick={() => navigate(`/eventos/${resolvedIdentity?.canonicalCategorySlug ?? ""}`)}
                >

                    Cancelar

                </button>

              <button
    type="button"
    className="album-form__save"
    onClick={handleSaveEvent}
    disabled={isSaving}
>

                   <Save size={18} />

{isSaving
    ? "Salvando..."
    : "Salvar Alterações"}

                </button>

            </div>


            <SaveToDriveModal
    open={showSaveToDriveModal}
    onCancel={() => {

        setShowSaveToDriveModal(false);

    }}
    onNo={async () => {

        setShowSaveToDriveModal(false);

        await handleUpdateAlbum(false);

    }}
    onYes={async () => {

        setShowSaveToDriveModal(false);

        await handleUpdateAlbum(true);

    }}
/>

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

export default EditEvent;
