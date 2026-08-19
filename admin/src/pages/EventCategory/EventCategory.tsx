import "./EventCategory.css";

import {
    useEffect,
    useMemo,
    useState,
} from "react";


import {
    Plus,
    Search,
    Pencil,
    Trash2,
    Images,
    ArrowLeft,
} from "lucide-react";


import {
    useNavigate,
    useParams,
} from "react-router-dom";


import {
    subscribeAlbumsByCategory,
} from "../../services/firebase/eventAlbum";


import {
    getEventCategory,
    resolveEventCategory,
} from "../../services/firebase/eventCategory";


import type {
    Album,
} from "../../types/eventAlbum";


import type {
    EventCategory as EventCategoryType,
} from "../../types/eventCategory";

import DeleteConfirmModal from "../../components/DeleteConfirmModal/DeleteConfirmModal";

import {
    deleteFolder,
} from "../../services/firebase/storageService";

import {
    deleteAlbum,
} from "../../services/firebase/eventAlbum";

import {
    deleteDriveFolder,
} from "../../services/api/google";

const EventCategory = () => {


    const navigate = useNavigate();


    const {
        categorySlug,
        categoryIdentifier,
    } = useParams();

    const requestedCategory = categorySlug ?? categoryIdentifier;




    const [albums,setAlbums] =
        useState<Album[]>([]);



    const [category,setCategory] =
        useState<EventCategoryType | null>(null);



    const [search,setSearch] =
        useState("");


const [showDeleteModal, setShowDeleteModal] =
    useState(false);

const [albumToDelete, setAlbumToDelete] =
    useState<Album | null>(null);



    useEffect(()=>{


        if(!requestedCategory)
            return;



        const loadCategory =
            async()=>{


                const identity = await resolveEventCategory(
                    requestedCategory,
                );

                const data =
                    await getEventCategory(
                        identity.categoryId
                    );


                setCategory(data);

                if (!identity.isCanonical) {
                    navigate(
                        `/eventos/${identity.canonicalSlug}`,
                        { replace: true },
                    );
                }


            };


        loadCategory();



    },[navigate, requestedCategory]);







    useEffect(()=>{


        if(!category)
            return;



        const unsubscribe =
            subscribeAlbumsByCategory(

                category.id!,

                setAlbums

            );


        return unsubscribe;



    },[category]);







    const filteredAlbums = useMemo(()=>{


        const value =
            search.toLowerCase();



        return albums.filter((album)=>


            (album.name ?? "")
                .toLowerCase()
                .includes(value)


        );



    },[
        albums,
        search
    ]);



const handleDeleteAlbum = async () => {

    if (!albumToDelete) return;

    try {

        const albumFolder =
            albumToDelete.name
                .trim()
                .replace(/[\\/:*?"<>|]/g, "-");

        // Firebase Storage
       // Firebase Storage
await deleteFolder(
    `AlbumFeed/${category?.name}/${albumFolder}`
);

        // Google Drive
        if (albumToDelete.driveFolderId) {

            await deleteDriveFolder({

                folderId:
                    albumToDelete.driveFolderId,

            });

        }

        // Firestore
        await deleteAlbum(
            albumToDelete.id!
        );

    } catch (error) {

        console.error(error);

    } finally {

        setShowDeleteModal(false);

        setAlbumToDelete(null);

    }

};



    return (


        <section className="albums">


       
<button
    type="button"
    className="event-category__back"
    onClick={() => navigate("/eventos")}
>
    <ArrowLeft size={18} />
    <span>Voltar</span>
</button>

<div className="event-category__header">

    <div className="event-category__title">

        <h2>
            Eventos - {category?.name ?? "Categoria"}
        </h2>

        <p>
            Gerencie os eventos publicados nesta categoria.
        </p>

    </div>

    <button
        type="button"
        className="event-category__new"
        onClick={() => {
            if (category?.slug) {
                navigate(`/eventos/${category.slug}/novo`);
            }
        }}
        disabled={!category?.slug}
    >
        <Plus size={18} />
        <span>Novo Evento</span>
    </button>

</div>
            






            <div className="albums__search">


                <Search size={18}/>



                <input

                    type="text"

                    placeholder="Pesquisar evento..."

                    value={search}

                    onChange={(event)=>
                        setSearch(
                            event.target.value
                        )
                    }

                />


            </div>







            <div className="albums__grid">





                {
                    filteredAlbums.length === 0 ? (


                        <div className="albums__empty">

                            Nenhum evento encontrado.


                        </div>



                    ) : (



                        filteredAlbums.map((album)=>(



                            <div

                                key={album.id}

                                className="album-card"


                            >



                                <div className="album-card__cover">


                                    {
                                        album.coverPhoto ? (


                                            <img

                                                src={
                                                    album.coverPhoto.preview
                                                }

                                                alt={
                                                    album.name
                                                }

                                            />



                                        ) : (


                                            <Images size={40}/>


                                        )

                                    }



                                </div>






                                <div className="album-card__content">



                                    {category && (

    <span className="album-card__category">

        {category.name}

    </span>

)}





                                    <h3>

                                        {album.name}

                                    </h3>






                                    <span>


                                        {(() => {


                                            const uniquePhotos =
                                                new Map();



                                            (album.photos ?? [])
                                                .forEach(photo=>{


                                                    uniquePhotos.set(

                                                        photo.storagePath ??
                                                        photo.preview,

                                                        photo

                                                    );


                                                });





                                            (album.categories ?? [])
                                                .forEach(category=>{


                                                    (category.photos ?? [])
                                                        .forEach(photo=>{


                                                            uniquePhotos.set(

                                                                photo.storagePath ??
                                                                photo.preview,

                                                                photo

                                                            );


                                                        });


                                                });




                                            const total =
                                                uniquePhotos.size;



                                            return (

                                                `${total} Foto${total !== 1 ? "s" : ""}`

                                            );



                                        })()}



                                    </span>




                                </div>







                                <div className="album-card__footer">





                                    <span

                                        className={
                                            `album-card__status album-card__status--${album.status}`
                                        }

                                    >


                                        {
                                            album.status === "published"

                                            ? "Publicado"

                                            : album.status === "draft"

                                            ? "Rascunho"

                                            : "Oculto"
                                        }


                                    </span>








                                    <div className="album-card__actions">


                                        <button

                                                onClick={() =>
                                                    navigate(
                                                `/eventos/${category?.slug}/${album.slug}`
                                            )
                                                }

                                            >

                                                <Pencil size={18}/>

                                            </button>




                                       <button
                                            onClick={() => {

                                                setAlbumToDelete(album);

                                                setShowDeleteModal(true);

                                            }}
                                        >

                                            <Trash2 size={18}/>

                                        </button>



                                    </div>




                                </div>






                            </div>



                        ))


                    )

                }




            </div>


<DeleteConfirmModal
    open={showDeleteModal}
    title="Excluir Evento"
    message={`Deseja realmente excluir o evento "${albumToDelete?.name}"? Esta ação removerá o evento e todos os arquivos armazenados.`}
    onCancel={() => {

        setShowDeleteModal(false);

        setAlbumToDelete(null);

    }}
    onConfirm={handleDeleteAlbum}
/>


        </section>


    );


};


export default EventCategory;
