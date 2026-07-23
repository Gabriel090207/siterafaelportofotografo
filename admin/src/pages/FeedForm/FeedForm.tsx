import "./FeedForm.css";

import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    createAlbumDocument,
    updateAlbum,
} from "../../services/firebase/albumFeed";

import {
    uploadAlbumFile,
} from "../../services/firebase/storageService";

import type {
    Album,
    AlbumPhoto,
} from "../../types/albumFeed";

import {
    ArrowLeft,
    FolderOpen,
    HardDrive,
    MonitorUp,
    Save,
    Trash2,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
    initializeGoogleAuth,
    requestAccessToken,
    getAccessToken,
} from "../../services/google/picker";

import {
    copyDriveFile,
    uploadFeedFileToDrive,
    copyPickerFileToDrive,
} from "../../services/api/google";

import LoadingModal from "../../components/LoadingModal/LoadingModal";
import SaveToDriveModal from "../../components/SaveToDriveModal/SaveToDriveModal";

import {
    feedCategories,
} from "../../data/feedCategories";

const STORAGE_KEY = "feed-form";

const FeedForm = () => {


const navigate = useNavigate();


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

const maxCategories = album.hasVideo ? 2 : 3;


const photosInputRef = useRef<HTMLInputElement>(null);
const videoInputRef = useRef<HTMLInputElement>(null);


const coverInputRef =
    useRef<HTMLInputElement>(null);

const [isSaving, setIsSaving] = useState(false);

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

    localStorage.removeItem(
        STORAGE_KEY
    );

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

type FeedFileItem =
    | Album["photos"][number]
    | Album["videos"][number];

const processFeedFile = async (
    item: FeedFileItem,
    albumToSave: Album,
    albumFolder: string,
    destinationFolder: string,
    saveToDrive: boolean,
) => {

    if (item.file) {

       

           if (saveToDrive) {

    const driveResult =
        await uploadFeedFileToDrive({

            file: item.file,

            albumCategory: album.category,

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

        album.category,

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

                albumCategory: album.category,

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

const handlePhotosUpload = (
    event: React.ChangeEvent<HTMLInputElement>
) => {

    const files = Array.from(event.target.files || []);

    const uploadedPhotos: AlbumPhoto[] = files.map((file) => ({

    id: crypto.randomUUID(),

    file,

    preview: URL.createObjectURL(file),

    name: file.name,

    size: file.size,

    source: "computer",

}));

 setAlbum((current) => ({
    ...current,
    photos: [
        ...current.photos,
        ...uploadedPhotos,
    ],
}));

};

const handleCreateAlbum = () => {

    setShowSaveToDriveModal(true);

};


const createAlbum = async (
    saveToDrive: boolean,
) => {

    if (isSaving) return;

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

        const albumId =
            await createAlbumDocument();

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

        
            /*
 * 2 - Capa
 */

updateLoading(
    20,
    "Enviando capa..."
);

if (albumToSave.coverPhoto?.file) {

    const coverFile =
        albumToSave.coverPhoto.file;

    if (saveToDrive) {

    const driveResult =
        await uploadFeedFileToDrive({

            file: coverFile,

            albumCategory:
                albumToSave.category,

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

        albumToSave.category,

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
        /*
 * 3 - Fotos
 */

updateLoading(
    30,
    "Enviando fotos..."
);

for (const photo of albumToSave.photos) {

    await processFeedFile(
    photo,
    albumToSave,
    albumFolder,
    "Fotos",
    saveToDrive
);

}
        /*
 * 4 - Vídeos
 */

updateLoading(
    60,
    "Enviando vídeos..."
);

for (const video of albumToSave.videos) {

    await processFeedFile(
    video,
    albumToSave,
    albumFolder,
    "Vídeos",
    saveToDrive
);

}

/*
 * 5 - Fotos das categorias
 */

updateLoading(
    72,
    "Enviando categorias..."
);

for (const category of albumToSave.categories) {

    const categoryName = category.name
        .trim()
        .replace(/[\\/:*?"<>|]/g, "-");

    for (const photo of category.photos) {

        await processFeedFile(
    photo,
    albumToSave,
    albumFolder,
    `Categorias/${categoryName}`,
    saveToDrive
);
    }

}

        /*
         * 6 - salva o documento final
         */

        updateLoading(
            93,
            "Salvando informações do evento..."
        );

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

      const category = feedCategories.find(
    (item) => item.name === albumToSave.category
);

navigate(
    `/feed/${category?.id ?? ""}`
);

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


const handleCategoryPhotosUpload = (
    categoryId: string,
    event: React.ChangeEvent<HTMLInputElement>
) => {

    const files = Array.from(
        event.target.files || []
    );

    const uploadedPhotos: AlbumPhoto[] = files.map((file) => ({

        id: crypto.randomUUID(),

        file,

        preview: URL.createObjectURL(file),

        name: file.name,

        size: file.size,

        source: "computer",

    }));

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

    const albumSaved = localStorage.getItem(
        STORAGE_KEY
    );

    if (!albumSaved) return;

    try {

        setAlbum(
            JSON.parse(albumSaved)
        );

    } catch {

        localStorage.removeItem(
            STORAGE_KEY
        );

    }

}, []);


useEffect(() => {

    const albumToSave = structuredClone(album);

    if (albumToSave.coverPhoto) {

        delete albumToSave.coverPhoto.file;

    }

    albumToSave.photos.forEach(photo => {

        delete photo.file;

    });

    albumToSave.videos.forEach(video => {

        delete video.file;

    });

    albumToSave.categories.forEach(category => {

        category.photos.forEach(photo => {

            delete photo.file;

        });

    });

    localStorage.setItem(

        STORAGE_KEY,

        JSON.stringify(albumToSave)

    );

}, [album]);

    return (

        <section className="album-form">

            <div className="album-form__top">

    <button
        className="album-form__back"
        onClick={() => navigate("/feed")}
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

        <option value="Casamentos">
            Casamentos
        </option>

        <option value="15 Anos">
            15 Anos
        </option>

        <option value="Pré Wedding">
            Pré Wedding
        </option>

        <option value="Book de 15 Anos">
            Book de 15 Anos
        </option>

        <option value="Infantil">
            Infantil
        </option>

        <option value="Book de Gestante">
            Book de Gestante
        </option>

        <option value="Aniversários">
            Aniversários
        </option>

        <option value="Ensaio Fotográfico">
            Ensaio Fotográfico
        </option>

        <option value="Corporativos">
            Corporativos
        </option>

        <option value="Formaturas">
            Formaturas
        </option>

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

                <div className="album-form__upload">

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

                </div>

              

<div className="album-form__upload-info">

   {album.photos.length === 0
    ? "Nenhuma foto adicionada."
    : `${album.photos.length} foto${album.photos.length > 1 ? "s" : ""} adicionada${album.photos.length > 1 ? "s" : ""}.`
}

</div>

{album.photos.length > 0 && (

    <div className="album-form__photos">

        {album.photos.map((photo) => (

            <div
                key={photo.id}
                className="album-form__photo"
            >

                <button
                    type="button"
                    className="album-form__photo-remove"
                    onClick={() =>
    setAlbum((current) => ({
        ...current,
        photos: current.photos.filter(
            (item) => item.id !== photo.id
        ),
    }))
}
                >

                    ×

                </button>

                <img
                    src={photo.preview}
                    alt={photo.name}
                />


                

                <span>

                    {photo.name}

                </span>

            </div>

        ))}

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

    <div className="album-form__category-upload">

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

    </div>

   <div className="album-form__category-info">

    {category.photos.length === 0
        ? "Nenhuma foto adicionada."
        : `${category.photos.length} foto${category.photos.length > 1 ? "s" : ""} adicionada${category.photos.length > 1 ? "s" : ""}.`
    }

</div>

{category.photos.length > 0 && (

    <div className="album-form__photos">

        {category.photos.map((photo) => (

            <div
                key={photo.id}
                className="album-form__photo"
            >

                <button
                    type="button"
                    className="album-form__photo-remove"
                    onClick={() =>
                        setAlbum((current) => ({

                            ...current,

                            categories: current.categories.map((item) =>

                                item.id === category.id
                                    ? {

                                        ...item,

                                        photos: item.photos.filter(
                                            (p) => p.id !== photo.id
                                        ),

                                    }
                                    : item

                            ),

                        }))
                    }
                >

                    ×

                </button>

                <img
                    src={photo.preview}
                    alt={photo.name}
                />


                <span>

                    {photo.name}

                </span>

            </div>

        ))}

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
                    onClick={() => navigate("/feed")}
                >

                    Cancelar

                </button>

              <button
    type="button"
    className="album-form__save"
    onClick={handleCreateAlbum}
    disabled={isSaving}
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

export default FeedForm;