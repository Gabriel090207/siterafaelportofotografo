import "./EventCategory.css";

import {
    useEffect,
    useMemo,
    useState,
    useRef,
    type ReactNode,
} from "react";


import {
    Plus,
    Search,
    Pencil,
    GripVertical,
    Trash2,
    Images,
    ArrowLeft,
    ImagePlus,
} from "lucide-react";


import {
    useNavigate,
    useParams,
} from "react-router-dom";


import {
    subscribeAlbumsByCategory,
    updateAlbumOrder,
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
import CategoryBannerModal from "../../components/CategoryBannerModal/CategoryBannerModal";

import {
    deleteFolder,
} from "../../services/firebase/storageService";

import {
    deleteAlbum,
} from "../../services/firebase/eventAlbum";

import {
    deleteDriveFolder,
} from "../../services/api/google";

import { useToast } from "../../contexts/ToastContext";

import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    rectSortingStrategy,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const SortableAlbumCard = ({ album, disabled, children }: {
    album: Album;
    disabled: boolean;
    children: (handle: ReactNode) => ReactNode;
}) => {
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
        useSortable({ id: album.id!, disabled });
    const handle = (
        <button
            type="button"
            ref={setActivatorNodeRef}
            className="album-card__drag-handle"
            disabled={disabled}
            {...attributes}
            {...listeners}
            aria-label={`Reordenar evento ${album.name}`}
            title={disabled ? "Reordenação indisponível durante busca ou salvamento" : "Reordenar evento"}
        >
            <GripVertical size={18} aria-hidden="true" />
        </button>
    );
    return (
        <div ref={setNodeRef}
            className={`album-card${isDragging ? " album-card--dragging" : ""}`}
            style={{ transform: CSS.Transform.toString(transform), transition }}>
            {children(handle)}
        </div>
    );
};

const EventCategory = () => {


    const navigate = useNavigate();

    const { showToast } = useToast();
    const [savingOrder, setSavingOrder] = useState(false);
    const savingOrderRef = useRef(false);
    const confirmedAlbums = useRef<Album[]>([]);
    const snapshotVersion = useRef(0);
    const dragVersion = useRef<number | null>(null);
    const subscriptionScope = useRef(0);
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 7 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );


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

const [showBannerModal, setShowBannerModal] =
    useState(false);



    useEffect(()=>{


        if(!requestedCategory)
            return;



        let cancelled = false;
        setCategory(null);
        const loadCategory =
            async()=>{


                const identity = await resolveEventCategory(
                    requestedCategory,
                );

                const data =
                    await getEventCategory(
                        identity.categoryId
                    );


                if (cancelled) return;
                setCategory(data);

                if (!identity.isCanonical) {
                    navigate(
                        `/eventos/${identity.canonicalSlug}`,
                        { replace: true },
                    );
                }


            };


        void loadCategory().catch(() => {
            if (!cancelled) showToast("Não foi possível carregar a categoria.", "error");
        });
        return () => { cancelled = true; };

    },[navigate, requestedCategory, showToast]);







    useEffect(() => {
        const scope = ++subscriptionScope.current;
        confirmedAlbums.current = [];
        dragVersion.current = null;
        savingOrderRef.current = false;
        setSavingOrder(false);
        setAlbums([]);
        if (!category?.id) return;
        const unsubscribe = subscribeAlbumsByCategory(category.id, (data, confirmed) => {
            if (scope !== subscriptionScope.current) return;
            snapshotVersion.current += 1;
            if (confirmed) confirmedAlbums.current = data;
            if (!savingOrderRef.current) setAlbums(data);
        }, () => {
            showToast("Não foi possível carregar os eventos.", "error");
        });
        return () => {
            unsubscribe();
            subscriptionScope.current += 1;
        };
    }, [category?.id, showToast]);

    const handleDragEnd = async ({ active, over }: DragEndEvent) => {
        const startedVersion = dragVersion.current;
        dragVersion.current = null;
        if (!category?.id || search.length > 0 || savingOrderRef.current
            || !over || active.id === over.id || startedVersion === null) return;
        if (startedVersion !== snapshotVersion.current) {
            showToast("A lista mudou durante o arraste. Tente novamente.", "warning");
            return;
        }
        const oldIndex = albums.findIndex((album) => album.id === active.id);
        const newIndex = albums.findIndex((album) => album.id === over.id);
        if (oldIndex < 0 || newIndex < 0) return;
        const ordered = arrayMove(albums, oldIndex, newIndex);
        const scope = subscriptionScope.current;
        savingOrderRef.current = true;
        setSavingOrder(true);
        setAlbums(ordered);
        try {
            await updateAlbumOrder(category.id, ordered);
            if (scope !== subscriptionScope.current) return;
            // The promise can settle before the metadata-only snapshot arrives.
            const confirmed = confirmedAlbums.current;
            const matchesSavedOrder = ordered.every((album, index) =>
                confirmed.some((item) => item.id === album.id && item.order === index + 1));
            setAlbums(matchesSavedOrder ? confirmed : ordered.map((album, index) => ({
                ...album, order: index + 1,
            })));
        } catch (error) {
            if (scope !== subscriptionScope.current) return;
            setAlbums(confirmedAlbums.current);
            showToast(error instanceof Error ? error.message : "Não foi possível salvar a ordem.", "error");
        } finally {
            if (scope === subscriptionScope.current) {
                savingOrderRef.current = false;
                setSavingOrder(false);
            }
        }
    };

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

        showToast(
            "Evento excluído com sucesso!",
            "success"
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

    <div className="event-category__actions">
        <button
            type="button"
            className="event-category__banner"
            onClick={() => setShowBannerModal(true)}
            disabled={!category?.id}
        >
            <ImagePlus size={18} />
            <span>Editar banner</span>
        </button>

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







            <DndContext sensors={sensors} collisionDetection={closestCenter}
                onDragStart={() => { dragVersion.current = snapshotVersion.current; }}
                onDragCancel={() => { dragVersion.current = null; }}
                onDragEnd={handleDragEnd}>
            <SortableContext items={filteredAlbums.map((album) => album.id!)} strategy={rectSortingStrategy}>
            <div className="albums__grid" aria-busy={savingOrder}>





                {
                    filteredAlbums.length === 0 ? (


                        <div className="albums__empty">

                            Nenhum evento encontrado.


                        </div>



                    ) : (



                        filteredAlbums.map((album)=>(



                            <SortableAlbumCard key={album.id} album={album}
                                disabled={savingOrder || search.length > 0 || !category?.id}>
                            {(dragHandle) => <>

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
                                        {dragHandle}


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






                            </> }
                            </SortableAlbumCard>



                        ))


                    )

                }




            </div>


            </SortableContext>
            </DndContext>

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

{category?.id && (
    <CategoryBannerModal
        open={showBannerModal}
        categoryId={category.id}
        categoryName={category.name}
        initialImages={category.bannerImages ?? []}
        onClose={() => setShowBannerModal(false)}
        onSaved={(bannerImages) => {
            setCategory((current) => current
                ? { ...current, bannerImages }
                : current
            );
        }}
    />
)}


        </section>


    );


};


export default EventCategory;
