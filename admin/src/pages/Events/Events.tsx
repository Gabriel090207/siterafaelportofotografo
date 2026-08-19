import "./Events.css";

import {
    useEffect,
    useState,
} from "react";

import {
    Plus,
    MoreVertical,
    EyeOff,
    GripVertical,
    Pencil,
} from "lucide-react";

import {
    useNavigate,
} from "react-router-dom";


import CreateCategoryModal from "../../components/CreateCategoryModal/CreateCategoryModal";
import EventOrderModal from "../../components/EventOrderModal/EventOrderModal";

import {
    subscribeEventCategories,
    createEventCategory,
    updateEventCategoryOrder,
    updateEventCategory,
} from "../../services/firebase/eventCategory";

import {
    uploadEventCategoryCover,
} from "../../services/firebase/storageService";


import type {
    EventCategory,
} from "../../types/eventCategory";

import {
    hideEventCategory,
    deleteEventCategory,
} from "../../services/firebase/eventCategory";



const Events = () => {


    const navigate = useNavigate();



    const [categories,setCategories] =
        useState<EventCategory[]>([]);



    const [showCategoryModal,setShowCategoryModal] =
        useState(false);

    const [editingCategory, setEditingCategory] =
        useState<EventCategory | null>(null);


    const [showOrderModal, setShowOrderModal] =
        useState(false);



    const [menuCategoryId,setMenuCategoryId] =
        useState<string | null>(null);




   useEffect(() => {

    const unsubscribe =
        subscribeEventCategories(
            (data)=>{


                const sorted =
                    [...data].sort(
                        (a,b)=>
                            (a.order ?? 999)
                            -
                            (b.order ?? 999)
                    );


                setCategories(sorted);


            }
        );


    return unsubscribe;


}, []);





    const handleCreateCategory = async ({
    name,
    file,
}: {
    name: string;
    file: File | null;
}) => {

if (!file) return;

        try {


            const upload =
                await uploadEventCategoryCover(
                    name,
                    file
                );



            await createEventCategory({

    name,

    cover:
        upload.url,

    storagePath:
        upload.storagePath,

    order:
        categories.length + 1,

});



            setShowCategoryModal(false);



        } catch(error){

            console.error(error);

        }


    };


    const handleUpdateCategory = async ({
    id,
    name,
}: {
    id: string;
    name: string;
}) => {

    try {

        await updateEventCategory(
            id,
            {
                name,
            }
        );

        setShowCategoryModal(false);

        setEditingCategory(null);

    } catch (error) {

        console.error(error);

    }

};



    const handleHideCategory = async (
    category: EventCategory
)=>{

    if(!category.id)
        return;


    await hideEventCategory(
        category.id
    );


    setMenuCategoryId(null);

};


const handleDeleteCategory = async (
    category: EventCategory
)=>{

    if(!category.id)
        return;



    await deleteEventCategory(

        category.id,

        category.storagePath

    );


    setMenuCategoryId(null);

};

const handleSaveOrder = async (
    orderedCategories: EventCategory[]
) => {


    await updateEventCategoryOrder(
        orderedCategories
    );


};

    return (


        <section className="events-page">



            <div className="events-page__header">


                <div>

                   <h2>
    Eventos
</h2>


                    <p>
    Gerencie os eventos publicados no site.
</p>


                </div>




                <div className="events-page__actions">


    <button

        className="events-page__button events-page__button--secondary"

        onClick={() =>
            navigate("/eventos/ocultos")
        }

    >

        <EyeOff size={18}/>

        Ocultos

    </button>



    <button

    className="events-page__button events-page__button--secondary"

    onClick={() =>
        setShowOrderModal(true)
    }

>

        <GripVertical size={18}/>

        Organizar no Site

    </button>





    <button

        className="events-page__new"

        onClick={() => {

    setEditingCategory(null);

    setShowCategoryModal(true);

}}

    >

        <Plus size={18}/>


        Nova Categoria de Evento


    </button>


</div>



            </div>






            <div className="events-grid">



                {categories.map((category)=>(


                    <div

                        key={category.id}

                        className="event-card"

                    >



                        <div className="event-card__cover">


                            <img

                                src={category.cover}

                                alt={category.name}

                            />



                        </div>





                        <button

                            className="event-card__menu"

                            onClick={()=>


                                setMenuCategoryId(

                                    menuCategoryId === category.id

                                    ? null

                                    : category.id!

                                )


                            }

                        >

                            <MoreVertical size={22}/>


                        </button>






                        {
                            menuCategoryId === category.id && (


                                <div className="event-card__dropdown">


                                    <button
    onClick={() =>
        handleHideCategory(category)
    }
>
    Ocultar Categoria
</button>


<button
    className="danger"
    onClick={() =>
        handleDeleteCategory(category)
    }
>
    Excluir Categoria
</button>



                                </div>


                            )
                        }






                        <div className="event-card__content">

    <div className="event-card__header">

        <h3>
            {category.name}
        </h3>

       <button
    className="event-card__edit"
    onClick={() => {

        setEditingCategory(category);

        setShowCategoryModal(true);

    }}
>

    <Pencil size={18} />

</button>

    </div>

    <button

        className="event-card__button"

        onClick={() =>

            navigate(
                `/eventos/${category.slug}`
            )

        }

    >

        Abrir Eventos

    </button>

</div>



                    </div>


                ))}



            </div>





          <CreateCategoryModal

    open={showCategoryModal}

    category={editingCategory}

    onClose={() => {

        setShowCategoryModal(false);

        setEditingCategory(null);

    }}

    onCreate={handleCreateCategory}

    onUpdate={async ({
        id,
        name,
    }) => {

        await handleUpdateCategory({
            id,
            name,
        });

    }}

/>



            <EventOrderModal

    open={showOrderModal}

    categories={categories}

    onClose={() =>
        setShowOrderModal(false)
    }

    onSave={handleSaveOrder}

/>



        </section>


    );


};


export default Events;
