import "./Albums.css";

import { useEffect, useMemo, useState } from "react";

import {
    Plus,
    Search,
    Pencil,
    Trash2,
    Images,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { subscribeAlbums } from "../../services/firebase/albumClient";

import type { AlbumClient } from "../../types/albumClient";


import DeleteConfirmModal from "../../components/DeleteConfirmModal/DeleteConfirmModal";

import {
    deleteFolder,
} from "../../services/firebase/storageService";

import {
    deleteAlbum,
} from "../../services/firebase/albumClient";

import {
    deleteDriveFolder,
} from "../../services/api/google";

import {
    useToast,
} from "../../contexts/ToastContext";

import {
    getErrorMessage,
} from "../../utils/errorMessage";

const Albums = () => {

    const { showToast } = useToast();

    const navigate = useNavigate();

    const [albums, setAlbums] =
        useState<AlbumClient[]>([]);

    const [search, setSearch] =
        useState("");


    const [showDeleteModal, setShowDeleteModal] =
    useState(false);

const [albumToDelete, setAlbumToDelete] =
    useState<AlbumClient | null>(null);

    useEffect(() => {

        const unsubscribe =
            subscribeAlbums(setAlbums);

        return unsubscribe;

    }, []);

    const filteredAlbums = useMemo(() => {

        const value =
            search.toLowerCase();

        return albums.filter((album) =>

            (album.name ?? "")
                .toLowerCase()
                .includes(value) ||

            (album.clientName ?? "")
                .toLowerCase()
                .includes(value)

        );

    }, [albums, search]);



    const handleDeleteAlbum = async () => {

    if (!albumToDelete) return;

    try {

        const albumFolder =
            albumToDelete.name
                .trim()
                .replace(/[\\/:*?"<>|]/g, "-");


        // Storage
        await deleteFolder(
            `AlbumClient/${albumToDelete.clientName}/${albumFolder}`
        );


        // Drive
        if (albumToDelete.driveFolderId) {

            await deleteDriveFolder({

                folderId: albumToDelete.driveFolderId,

            });

        }


        // Firestore
        await deleteAlbum(
            albumToDelete.id!
            
        );

        showToast(
    "Álbum removido com sucesso!",
    "success"
);


    } catch (error) {

    console.error(error);

    showToast(
        getErrorMessage(error),
        "error"
    );

} finally {

        setShowDeleteModal(false);

        setAlbumToDelete(null);

    }

};

    return (

        <section className="albums">

            <div className="albums__header">

                <div>

                    <h2>Álbuns</h2>

                    <p>

                        Gerencie todos os álbuns dos seus clientes.

                    </p>

                </div>

                <button
                    className="albums__new"
                    onClick={() =>
                        navigate("/albums/new")
                    }
                >

                    <Plus size={18} />

                    <span>

                        Novo Álbum

                    </span>

                </button>

            </div>

            <div className="albums__search">

                <Search size={18} />

                <input
                    type="text"
                    placeholder="Pesquisar álbum..."
                    value={search}
                    onChange={(event) =>
                        setSearch(
                            event.target.value
                        )
                    }
                />

            </div>

            <div className="albums__grid">

                {filteredAlbums.length === 0 ? (

                    <div className="albums__empty">

                        Nenhum álbum encontrado.

                    </div>

                ) : (

                   filteredAlbums.map((album) => {

    const totalPhotos =
        (album.watermarkedPhotos?.length ?? 0) +
        (album.highQualityPhotos?.length ?? 0);


    const totalVideos =
        (album.watermarkedVideos?.length ?? 0) +
        (album.highQualityVideos?.length ?? 0);


    return (

                        <div
                            key={album.id}
                            className="album-card"
                        >

                            <div className="album-card__cover">

                                {album.coverPhoto ? (

                                    <img
                                        src={
                                            album.coverPhoto.preview
                                        }
                                        alt={
                                            album.name
                                        }
                                    />

                                ) : (

                                    <Images size={40} />

                                )}

                            </div>

                            <div className="album-card__content">

                                <h3>

                                    {album.name}

                                </h3>

                                <p>

                                    {album.clientName}

                                </p>

                                <span>

                                  {totalPhotos} Foto{totalPhotos !== 1 ? "s" : ""}

{" • "}

{totalVideos} Vídeo{totalVideos !== 1 ? "s" : ""}

                                </span>

                                

                            </div>

                            

                            <div className="album-card__footer">

                                <span
                                    className={`album-card__status album-card__status--${album.status}`}
                                >

                                    {album.status === "published"
                                        ? "Publicado"
                                        : album.status === "draft"
                                        ? "Rascunho"
                                        : "Oculto"}

                                </span>

                                <div className="album-card__actions">

                                    <button
    onClick={() =>
        navigate(`/albums/${album.id}/edit`)
    }
>

    <Pencil size={18} />

</button>

                                   <button
    onClick={() => {

        setAlbumToDelete(album);

        setShowDeleteModal(true);

    }}
>

    <Trash2 size={18} />

</button>

                                </div>

                                

                            </div>

                            

                                                </div>

                    );

                })

                )}


                

            </div>

            <DeleteConfirmModal
    open={showDeleteModal}
    title="Excluir álbum"
    message={`Deseja realmente excluir "${albumToDelete?.name}"? Esta ação removerá o álbum e todos os arquivos armazenados.`}
    onCancel={() => {

        setShowDeleteModal(false);

        setAlbumToDelete(null);

    }}
    onConfirm={handleDeleteAlbum}
/>

        </section>

    );

};

export default Albums;