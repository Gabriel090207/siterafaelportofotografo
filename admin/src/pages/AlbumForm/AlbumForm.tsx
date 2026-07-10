import "./AlbumForm.css";

import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    createAlbumDocument,
    updateAlbum,
} from "../../services/firebase/album";

import {
    uploadAlbumFile,
} from "../../services/firebase/storageService";

import type {
    Album,
    AlbumPhoto,
} from "../../types/album";

import type { Client } from "../../types/client";

import {
    subscribeClients,
} from "../../services/firebase/clients";

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
} from "../../services/google/picker";

const STORAGE_KEY = "album-form";

const AlbumForm = () => {


const navigate = useNavigate();


const [album, setAlbum] = useState<Album>({
    clientId: "",
    clientName: "",

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

const [clients, setClients] = useState<Client[]>([]);

const maxCategories = album.hasVideo ? 2 : 3;


const photosInputRef = useRef<HTMLInputElement>(null);
const videoInputRef = useRef<HTMLInputElement>(null);


const coverInputRef =
    useRef<HTMLInputElement>(null);


const [isSaving, setIsSaving] = useState(false);


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

const handleCreateAlbum = async () => {

    if (isSaving) return;

    setIsSaving(true);

    try {

        // 1 - cria documento e obtém o id

        const albumId =
            await createAlbumDocument();

        const albumToSave = structuredClone(album);

        const albumFolder = albumToSave.name
            .trim()
            .replace(/[\\/:*?"<>|]/g, "-");

        // 2 - capa

        if (
            albumToSave.coverPhoto?.file
        ) {

            const result =
                await uploadAlbumFile(

                    albumFolder,

                    "Capa/capa.jpg",

                    albumToSave.coverPhoto.file

                );

            albumToSave.coverPhoto = {

                ...albumToSave.coverPhoto,

                preview: result.url,

                storagePath: result.storagePath,

            };

            delete albumToSave.coverPhoto.file;

        }

        // 3 - fotos gerais

        for (const photo of albumToSave.photos) {

            if (
                photo.source === "computer" &&
                photo.file
            ) {


                const result =
                    await uploadAlbumFile(

                        albumFolder,

                        `Fotos/${photo.name}`,

                        photo.file

                    );

                console.log("Upload Foto:", result);

                photo.preview = result.url;

                photo.storagePath =
                    result.storagePath;

                delete photo.file;

            }

        }

        // 4 - vídeos

        for (const video of albumToSave.videos) {

            if (
                video.source === "computer" &&
                video.file
            ) {

               

                const result =
                    await uploadAlbumFile(

                        albumFolder,

                        `Video/${video.name}`,

                        video.file

                    );

                console.log("Upload Vídeo:", result);

                video.preview = result.url;

                video.storagePath =
                    result.storagePath;

                delete video.file;

            }

        }

        // 5 - categorias

        for (const category of albumToSave.categories) {

            for (const photo of category.photos) {

                if (
                    photo.source === "computer" &&
                    photo.file
                ) {

                   

                    const result =
                        await uploadAlbumFile(

                            albumFolder,

                            `Categorias/${category.name}/${photo.name}`,

                            photo.file

                        );

                    console.log("Upload Categoria:", result);

                    photo.preview = result.url;

                    photo.storagePath =
                        result.storagePath;

                    delete photo.file;

                }

            }

        }

        // 6 - salva documento final

        await updateAlbum(

            albumId,

            albumToSave

        );

        localStorage.removeItem(
            STORAGE_KEY
        );

        navigate("/albums");

    } catch (error) {

        console.error(error);

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

    const unsubscribe = subscribeClients(
        setClients
    );

    return unsubscribe;

}, []);


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
        onClick={() => navigate("/albums")}
    >

        <ArrowLeft size={18} />

        <span>Voltar</span>

    </button>

    <div className="album-form__title">

        <h2>Novo Álbum</h2>

        <p>
            Crie um novo álbum para um cliente.
        </p>

    </div>

</div>

            <div className="album-form__card">

                <h3>Informações</h3>

                <div className="album-form__grid">

                    <div className="album-form__field">

                        <label>Nome do Álbum</label>

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

                    <div className="album-form__field">

                        <label>Cliente</label>

                       <select
    value={album.clientId}
    onChange={(event) => {

    const client = clients.find(
        (item) => item.id === event.target.value
    );

    setAlbum((current) => ({

        ...current,

        clientId: event.target.value,

        clientName: client?.name ?? "",

    }));

}}
>

    <option value="">
        Selecionar Cliente
    </option>

    {clients.map(client => (

        <option
            key={client.id}
            value={client.id}
        >

            {client.name}

        </option>

    ))}

</select>





                    </div>

<div
    className="album-form__field"
    style={{ gridColumn: "1 / -1" }}
>

    <label>Categoria do Álbum</label>

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
    placeholder="Descrição do álbum..."
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
                Ative esta opção caso o álbum também possua vídeo.
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
                Organize as fotografias do álbum em categorias.
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

        <button>

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

    <label>Capa do Álbum</label>

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
                    onClick={() => navigate("/albums")}
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
    : "Criar Álbum"}

                </button>

            </div>

            

        </section>

    );

};

export default AlbumForm;