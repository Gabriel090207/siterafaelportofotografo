import "./AlbumForm.css";

import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    createAlbumDocument,
    updateAlbum,
} from "../../services/firebase/albumClient";

import {
    uploadAlbumClientFile,
} from "../../services/firebase/storageService";

import type {
    AlbumClient,
    AlbumClientPhoto,
    AlbumClientVideo,
} from "../../types/albumClient";

import {
    ArrowLeft,
    FolderOpen,
    HardDrive,
    MonitorUp,
    Save,
   
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
    initializeGoogleAuth,
    requestAccessToken,
} from "../../services/google/picker";


import {
    subscribeClients,
} from "../../services/firebase/clients";

import type { Client } from "../../types/client";

const STORAGE_KEY = "album-form";

const AlbumForm = () => {

const [clients, setClients] =
    useState<Client[]>([]);

useEffect(() => {

    const unsubscribe =
        subscribeClients(setClients);

    return unsubscribe;

}, []);


const navigate = useNavigate();


const [album, setAlbum] = useState<AlbumClient>({

    name: "",
    description: "",

    clientId: "",

    clientName: "",

    status: "published",

    coverPhoto: undefined,

    watermarkedPhotos: [],

    highQualityPhotos: [],

    watermarkedVideos: [],

    highQualityVideos: [],

    highQualityDownloadDays: null,
});

const coverInputRef =
    useRef<HTMLInputElement>(null);


const watermarkedPhotosInputRef =
    useRef<HTMLInputElement>(null);


const highQualityPhotosInputRef =
    useRef<HTMLInputElement>(null);


const watermarkedVideoInputRef =
    useRef<HTMLInputElement>(null);


const highQualityVideoInputRef =
    useRef<HTMLInputElement>(null);

const [isSaving, setIsSaving] = useState(false);




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
                await uploadAlbumClientFile(
    albumFolder,
    "Cover/capa.jpg",
    albumToSave.coverPhoto.file
);

            albumToSave.coverPhoto = {

                ...albumToSave.coverPhoto,

                preview: result.url,

                storagePath: result.storagePath,

            };

            delete albumToSave.coverPhoto.file;

        }


        // 3 - Fotos com marca d'água

for (const photo of albumToSave.watermarkedPhotos) {

    if (!photo.file) continue;

    const result =
        await uploadAlbumClientFile(

            albumFolder,

            `WatermarkedPhotos/${photo.name}`,

            photo.file

        );

    photo.preview = result.url;

    photo.storagePath = result.storagePath;

    delete photo.file;

}


// 4 - Fotos em alta qualidade

for (const photo of albumToSave.highQualityPhotos) {

    if (!photo.file) continue;

    const result =
        await uploadAlbumClientFile(

            albumFolder,

            `HighQualityPhotos/${photo.name}`,

            photo.file

        );

    photo.preview = result.url;

    photo.storagePath = result.storagePath;

    delete photo.file;

}


// 5 - Vídeos com marca d'água

for (const video of albumToSave.watermarkedVideos) {

    if (!video.file) continue;

    const result =
        await uploadAlbumClientFile(

            albumFolder,

            `WatermarkedVideos/${video.name}`,

            video.file

        );

    video.preview = result.url;

    video.storagePath = result.storagePath;

    delete video.file;

}



// 6 - Vídeos em alta qualidade

for (const video of albumToSave.highQualityVideos) {

    if (!video.file) continue;

    const result =
        await uploadAlbumClientFile(

            albumFolder,

            `HighQualityVideos/${video.name}`,

            video.file

        );

    video.preview = result.url;

    video.storagePath = result.storagePath;

    delete video.file;

}


        // 7 - salva documento final

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


const handleCoverUpload = (
    event: React.ChangeEvent<HTMLInputElement>
) => {

    const file = event.target.files?.[0];

    if (!file) return;

    const coverPhoto: AlbumClientPhoto = {

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

const handleWatermarkedPhotosUpload = (
    event: React.ChangeEvent<HTMLInputElement>
) => {

    const files = Array.from(
        event.target.files || []
    );

    const uploadedPhotos: AlbumClientPhoto[] =
        files.map((file) => ({

            id: crypto.randomUUID(),

            file,

            preview: URL.createObjectURL(file),

            name: file.name,

            size: file.size,

            source: "computer",

        }));

    setAlbum((current) => ({

        ...current,

        watermarkedPhotos: [

            ...current.watermarkedPhotos,

            ...uploadedPhotos,

        ],

    }));

};


const handleHighQualityPhotosUpload = (
    event: React.ChangeEvent<HTMLInputElement>
) => {

    const files = Array.from(
        event.target.files || []
    );

    const uploadedPhotos: AlbumClientPhoto[] =
        files.map((file) => ({

            id: crypto.randomUUID(),

            file,

            preview: URL.createObjectURL(file),

            name: file.name,

            size: file.size,

            source: "computer",

        }));

    setAlbum((current) => ({

        ...current,

        highQualityPhotos: [

            ...current.highQualityPhotos,

            ...uploadedPhotos,

        ],

    }));

};



const handleWatermarkedVideoUpload = (
    event: React.ChangeEvent<HTMLInputElement>
) => {

    const files = Array.from(
        event.target.files || []
    );

    const uploadedVideos: AlbumClientVideo[] =
        files.map((file) => ({

            id: crypto.randomUUID(),

            file,

            preview: URL.createObjectURL(file),

            name: file.name,

            size: file.size,

            source: "computer",

        }));

    setAlbum((current) => ({

        ...current,

        watermarkedVideos: [

            ...current.watermarkedVideos,

            ...uploadedVideos,

        ],

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


const handleHighQualityVideoUpload = (
    event: React.ChangeEvent<HTMLInputElement>
) => {

    const files = Array.from(
        event.target.files || []
    );

    const uploadedVideos: AlbumClientVideo[] =
        files.map((file) => ({

            id: crypto.randomUUID(),

            file,

            preview: URL.createObjectURL(file),

            name: file.name,

            size: file.size,

            source: "computer",

        }));

    setAlbum((current) => ({

        ...current,

        highQualityVideos: [

            ...current.highQualityVideos,

            ...uploadedVideos,

        ],

    }));

};

useEffect(() => {

    const albumToSave = structuredClone(album);

    if (albumToSave.coverPhoto) {

        delete albumToSave.coverPhoto.file;

    }

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

                   

<div
    className="album-form__field"
    style={{ gridColumn: "1 / -1" }}
>


    <div
    className="album-form__field"
    style={{ gridColumn: "1 / -1" }}
>

    <label>Cliente</label>

   <select
    value={album.clientId}
    onChange={(event) => {

        const client = clients.find(
            (item) =>
                item.id === event.target.value
        );

        setAlbum((current) => ({

            ...current,

            clientId: client?.id ?? "",

            clientName: client?.name ?? "",

        }));

    }}
>

    <option value="">

        Selecione um cliente

    </option>

    {clients.map((client) => (

        <option
            key={client.id}
            value={client.id}
        >

            {client.name}

        </option>

    ))}

</select>

</div>

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

    <h3>Fotos com marca d'água</h3>

    <div className="album-form__upload">

        <input
            ref={watermarkedPhotosInputRef}
            type="file"
            multiple
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleWatermarkedPhotosUpload}
        />

        <button
            type="button"
            onClick={() =>
                watermarkedPhotosInputRef.current?.click()
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

                                watermarkedPhotos: [

                                    ...current.watermarkedPhotos,

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

        {album.watermarkedPhotos.length === 0

            ? "Nenhuma foto adicionada."

            : `${album.watermarkedPhotos.length} foto${album.watermarkedPhotos.length > 1 ? "s" : ""} adicionada${album.watermarkedPhotos.length > 1 ? "s" : ""}.`

        }

    </div>

    {album.watermarkedPhotos.length > 0 && (

        <div className="album-form__photos">

            {album.watermarkedPhotos.map((photo) => (

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

                                watermarkedPhotos:

                                    current.watermarkedPhotos.filter(
                                        (item) =>
                                            item.id !== photo.id
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

    <h3>Fotos em alta qualidade</h3>

    <div className="album-form__upload">

        <input
            ref={highQualityPhotosInputRef}
            type="file"
            multiple
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleHighQualityPhotosUpload}
        />

        <button
            type="button"
            onClick={() =>
                highQualityPhotosInputRef.current?.click()
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

                                highQualityPhotos: [

                                    ...current.highQualityPhotos,

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

        {album.highQualityPhotos.length === 0

            ? "Nenhuma foto adicionada."

            : `${album.highQualityPhotos.length} foto${album.highQualityPhotos.length > 1 ? "s" : ""} adicionada${album.highQualityPhotos.length > 1 ? "s" : ""}.`

        }

    </div>

    {album.highQualityPhotos.length > 0 && (

        <div className="album-form__photos">

            {album.highQualityPhotos.map((photo) => (

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

                                highQualityPhotos:
                                    current.highQualityPhotos.filter(
                                        (item) =>
                                            item.id !== photo.id
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

    <h3>Vídeo com marca d'água</h3>

    <div className="album-form__upload">

        <input
            ref={watermarkedVideoInputRef}
            type="file"
            multiple
            accept="video/*"
            style={{ display: "none" }}
            onChange={handleWatermarkedVideoUpload}
        />

        <button
            type="button"
            onClick={() =>
                watermarkedVideoInputRef.current?.click()
            }
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

        {album.watermarkedVideos.length === 0

            ? "Nenhum vídeo adicionado."

            : `${album.watermarkedVideos.length} vídeo${album.watermarkedVideos.length > 1 ? "s" : ""} adicionado${album.watermarkedVideos.length > 1 ? "s" : ""}.`

        }

    </div>

    {album.watermarkedVideos.length > 0 && (

        <div className="album-form__photos">

            {album.watermarkedVideos.map((video) => (

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

                                watermarkedVideos:
                                    current.watermarkedVideos.filter(
                                        (item) =>
                                            item.id !== video.id
                                    ),

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

</div>


<div className="album-form__card">

    <h3>Vídeo em alta qualidade</h3>

    <div className="album-form__upload">

        <input
            ref={highQualityVideoInputRef}
            type="file"
            accept="video/*"
            style={{ display: "none" }}
            onChange={handleHighQualityVideoUpload}
        />

        <button
            type="button"
            onClick={() =>
                highQualityVideoInputRef.current?.click()
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

                                highQualityVideos: [

                                    ...current.highQualityVideos,

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

        {album.highQualityVideos.length === 0

            ? "Nenhum vídeo adicionado."

            : `${album.highQualityVideos.length} vídeo${album.highQualityVideos.length > 1 ? "s" : ""} adicionado${album.highQualityVideos.length > 1 ? "s" : ""}.`

        }

    </div>

    {album.highQualityVideos.length > 0 && (

        <div className="album-form__photos">

            {album.highQualityVideos.map((video) => (

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

                                highQualityVideos:
                                    current.highQualityVideos.filter(
                                        (item) =>
                                            item.id !== video.id
                                    ),

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

</div>


<div className="album-form__card">

    <h3>Download das Fotos em Alta Qualidade</h3>

    <div className="album-form__grid">

        <div className="album-form__field">

            <label>

                Prazo para download

            </label>

            <select
                value={
                    album.highQualityDownloadDays ?? ""
                }
                onChange={(event) =>
                    setAlbum((current) => ({

                        ...current,

                        highQualityDownloadDays:

                            event.target.value === ""

                                ? null

                                : Number(event.target.value),

                    }))
                }
            >

                <option value="">

                    Sem prazo

                </option>

                <option value="7">

                    7 dias

                </option>

                <option value="15">

                    15 dias

                </option>

                <option value="30">

                    30 dias

                </option>

                <option value="60">

                    60 dias

                </option>

                <option value="90">

                    90 dias

                </option>

                <option value="180">

                    180 dias

                </option>

                <option value="365">

                    365 dias

                </option>

            </select>

        </div>

    </div>

    <p className="album-form__helper">

        Após esse período, os downloads em alta qualidade serão bloqueados automaticamente. As fotos com marca d'água continuarão disponíveis normalmente.

    </p>

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