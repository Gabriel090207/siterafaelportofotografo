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
    getAccessToken,
} from "../../services/google/picker";


import {
    subscribeClients,
} from "../../services/firebase/clients";

import type { Client } from "../../types/client";

import {
    copyDriveFile,
    uploadAlbumFileToDrive,
    copyPickerAlbumFileToDrive,
} from "../../services/api/google";

import LoadingModal from "../../components/LoadingModal/LoadingModal";
import SaveToDriveModal from "../../components/SaveToDriveModal/SaveToDriveModal";

import {
    useToast,
} from "../../contexts/ToastContext";

import {
    getErrorMessage,
} from "../../utils/errorMessage";

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

const { showToast } = useToast();

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

const [showSaveToDriveModal, setShowSaveToDriveModal] =
    useState(false);

const [loadingModal, setLoadingModal] =
    useState({

        open: false,

        success: false,

        progress: 0,

        title: "Criando álbum",

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

const processAlbumFile = async (
    item: AlbumClientPhoto | AlbumClientVideo,
    albumFolder: string,
    destinationFolder: string,
    saveToDrive: boolean,
    setDriveFolderId: (id: string) => void,
) => {

    if (item.file) {

    console.log("item.file:", item.file);
    console.log("instanceof File:", item.file instanceof File);
    console.log("constructor:", item.file.constructor?.name);

    if (saveToDrive) {


        console.log({
    clientName: album.clientName,
    albumName: album.name,
    category: destinationFolder,
});

        const driveResult =
    await uploadAlbumFileToDrive({

        file: item.file,

        clientName: album.clientName,

        albumName: album.name,

        category: destinationFolder,

    });

setDriveFolderId(
    driveResult.albumFolderId
);

item.driveFileId =
    driveResult.driveFileId;

    }

    const result =
       await uploadAlbumClientFile(
    `${album.clientName}/${albumFolder}`,
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
                await copyPickerAlbumFileToDrive({

                    fileId: item.driveId,

                    accessToken: token,

                    clientName: album.clientName,

                    albumName: album.name,

                    category: destinationFolder,

                });

            item.driveFileId =
                driveResult.file.id;

        }

    }

    const result =
        await copyDriveFile({

            sourcePath: item.storagePath,

            destinationPath:
    `AlbumClient/${album.clientName}/${albumFolder}/${destinationFolder}/${item.name}`,

        });

    item.preview = result.url;

    item.storagePath = result.path;

}

};


const createAlbum = async (
    saveToDrive: boolean
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

    updateLoading(
    5,
    "Criando álbum..."
);

    try {

        // 1 - cria documento e obtém o id

        const albumId =
        
            await createAlbumDocument();

            updateLoading(
    15,
    "Documento criado."
);

        const albumToSave: AlbumClient = {

    ...album,

    coverPhoto: album.coverPhoto
        ? { ...album.coverPhoto }
        : undefined,

    watermarkedPhotos: album.watermarkedPhotos.map(photo => ({
        ...photo,
    })),

    highQualityPhotos: album.highQualityPhotos.map(photo => ({
        ...photo,
    })),

    watermarkedVideos: album.watermarkedVideos.map(video => ({
        ...video,
    })),

    highQualityVideos: album.highQualityVideos.map(video => ({
        ...video,
    })),

};


let driveFolderId: string | undefined;

        const albumFolder = albumToSave.name
            .trim()
            .replace(/[\\/:*?"<>|]/g, "-");

        // 2 - capa

        if (
            albumToSave.coverPhoto?.file
        ) {

            if (saveToDrive) {

   const driveResult =
    await uploadAlbumFileToDrive({

        file: albumToSave.coverPhoto.file,

        clientName: album.clientName,

        albumName: album.name,

        category: "Capa",

    });

if (!driveFolderId) {

    driveFolderId =
        driveResult.albumFolderId;

}

albumToSave.coverPhoto!.driveFileId =
    driveResult.driveFileId;

}

            const result =
               await uploadAlbumClientFile(
    `${album.clientName}/${albumFolder}`,
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

        updateLoading(
    25,
    "Capa enviada."
);


        // 3 - Fotos com marca d'água


        updateLoading(
    35,
    "Enviando fotos com marca d'água..."
);

for (const photo of albumToSave.watermarkedPhotos) {

  await processAlbumFile(
    photo,
    albumFolder,
    "Fotos com Marca d'Água",
    saveToDrive,
    (id) => {
        if (!driveFolderId) {
            driveFolderId = id;
        }
    }
);

}


updateLoading(
    55,
    "Enviando fotos em alta qualidade..."
);

// 4 - Fotos em alta qualidade

for (const photo of albumToSave.highQualityPhotos) {

   await processAlbumFile(
    photo,
    albumFolder,
    "Fotos em Alta Qualidade",
    saveToDrive,
    (id) => {
        if (!driveFolderId) {
            driveFolderId = id;
        }
    }
);

}


updateLoading(
    70,
    "Enviando vídeos com marca d'água..."
);
// 5 - Vídeos com marca d'água
for (const video of albumToSave.watermarkedVideos) {

    await processAlbumFile(
    video,
    albumFolder,
    "Vídeos com Marca d'Água",
    saveToDrive,
    (id) => {
        if (!driveFolderId) {
            driveFolderId = id;
        }
    }
);

}

updateLoading(
    85,
    "Enviando vídeos em alta qualidade..."
);

// 6 - Vídeos em alta qualidade

for (const video of albumToSave.highQualityVideos) {

    await processAlbumFile(
    video,
    albumFolder,
    "Vídeos em Alta Qualidade",
    saveToDrive,
    (id) => {
        if (!driveFolderId) {
            driveFolderId = id;
        }
    }
);

}

        // 7 - salva documento final


        if (driveFolderId) {

    albumToSave.driveFolderId =
        driveFolderId;

}


        await updateAlbum(

            albumId,

            albumToSave

        );

        setLoadingModal((current) => ({

    ...current,

    success: true,

    progress: 100,

    message: "Álbum criado com sucesso!",

}));

        localStorage.removeItem(
            STORAGE_KEY
        );

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

showToast(
    "Álbum criado com sucesso!",
    "success"
);

navigate("/albums");

       } catch (error) {

        console.error(error);


        showToast(
            getErrorMessage(error),
            "error"
        );


    } finally {

        setIsSaving(false);

    }

};

const validateAlbum = () => {


    if (!album.name.trim()) {

        showToast(
            "Informe o nome do álbum.",
            "warning"
        );

        return false;

    }


    if (!album.clientId) {

        showToast(
            "Selecione um cliente.",
            "warning"
        );

        return false;

    }


    if (!album.eventDate) {

        showToast(
            "Informe a data do evento.",
            "warning"
        );

        return false;

    }


    if (!album.eventTime) {

        showToast(
            "Informe o horário do evento.",
            "warning"
        );

        return false;

    }


    if (!album.eventLocation?.trim()) {

        showToast(
            "Informe o local do evento.",
            "warning"
        );

        return false;

    }


    if (!album.description.trim()) {

        showToast(
            "Informe a descrição do álbum.",
            "warning"
        );

        return false;

    }


    if (!album.coverPhoto) {

        showToast(
            "Selecione uma capa para o álbum.",
            "warning"
        );

        return false;

    }


    return true;

};

const handleCreateAlbum = () => {


    if (!validateAlbum()) {

        return;

    }


    setShowSaveToDriveModal(true);

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


/*
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
*/

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

/*
useEffect(() => {

    const albumToStore: AlbumClient = {

        ...album,

        // Arquivos escolhidos no computador não podem
        // ser armazenados no localStorage.
        coverPhoto: album.coverPhoto?.file
            ? undefined
            : album.coverPhoto,

        watermarkedPhotos:
            album.watermarkedPhotos.filter(
                (photo) => !photo.file
            ),

        highQualityPhotos:
            album.highQualityPhotos.filter(
                (photo) => !photo.file
            ),

        watermarkedVideos:
            album.watermarkedVideos.filter(
                (video) => !video.file
            ),

        highQualityVideos:
            album.highQualityVideos.filter(
                (video) => !video.file
            ),

    };

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(albumToStore)
    );

}, [album]);
*/

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

    showToast(
        getErrorMessage(error),
        "error"
    );

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

    showToast(
        getErrorMessage(error),
        "error"
    );

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

    showToast(
        getErrorMessage(error),
        "error"
    );

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

Criar Álbum

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

export default AlbumForm;