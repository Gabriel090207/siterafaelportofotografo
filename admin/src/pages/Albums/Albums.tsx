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

import { subscribeAlbums } from "../../services/firebase/album";

import type { Album } from "../../types/album";

const Albums = () => {

    const navigate = useNavigate();

    const [albums, setAlbums] = useState<Album[]>([]);

    const [search, setSearch] = useState("");

    useEffect(() => {

        const unsubscribe = subscribeAlbums(setAlbums);

        return unsubscribe;

    }, []);

    const filteredAlbums = useMemo(() => {

    const value = search.toLowerCase();

    return albums.filter((album) =>

        (album.name ?? "").toLowerCase().includes(value) ||

        (album.clientName ?? "").toLowerCase().includes(value)

    );

}, [albums, search]);

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
                        setSearch(event.target.value)
                    }
                />

            </div>

            <div className="albums__grid">

                {filteredAlbums.length === 0 ? (

                    <div className="albums__empty">

                        Nenhum álbum encontrado.

                    </div>

                ) : (

                    filteredAlbums.map((album) => (

                        <div
                            key={album.id}
                            className="album-card"
                        >

                            <div className="album-card__cover">

                                {album.coverPhoto ? (

                                    <img
                                        src={album.coverPhoto.preview}
                                        alt={album.name}
                                    />

                                ) : (

                                    <Images size={40} />

                                )}

                            </div>

                            <div className="album-card__content">



{album.category && (

    <span className="album-card__category">

        {album.category}

    </span>

)}
                                <h3>

                                    {album.name}

                                </h3>

                                <p>

                                    {album.clientName}

                                </p>

                                <span>

    {(() => {

        const uniquePhotos = new Map();

        (album.photos ?? []).forEach(photo => {

            uniquePhotos.set(
                photo.storagePath ?? photo.preview,
                photo
            );

        });

        (album.categories ?? []).forEach(category => {

            (category.photos ?? []).forEach(photo => {

                uniquePhotos.set(
                    photo.storagePath ?? photo.preview,
                    photo
                );

            });

        });

        const total = uniquePhotos.size;

        return `${total} Foto${total !== 1 ? "s" : ""}`;

    })()}

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

                                    <button>

                                        <Pencil size={18} />

                                    </button>

                                    <button>

                                        <Trash2 size={18} />

                                    </button>

                                </div>

                            </div>

                        </div>

                    ))

                )}

            </div>

        </section>

    );

};

export default Albums;