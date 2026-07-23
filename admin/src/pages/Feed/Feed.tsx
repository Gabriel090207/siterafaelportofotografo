import "./Feed.css";

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
import FeedOrderModal from "../../components/FeedOrderModal/FeedOrderModal";

import {
    subscribeFeedCategories,
    createFeedCategory,
    updateFeedCategoryOrder,
    updateFeedCategory,
} from "../../services/firebase/feedCategory";

import {
    uploadFeedCategoryCover,
} from "../../services/firebase/storageService";


import type {
    FeedCategory,
} from "../../types/feedCategory";

import {
    hideFeedCategory,
    deleteFeedCategory,
} from "../../services/firebase/feedCategory";



const Feed = () => {


    const navigate = useNavigate();



    const [categories,setCategories] =
        useState<FeedCategory[]>([]);



    const [showCategoryModal,setShowCategoryModal] =
        useState(false);

    const [editingCategory, setEditingCategory] =
        useState<FeedCategory | null>(null);


    const [showOrderModal, setShowOrderModal] =
        useState(false);



    const [menuCategoryId,setMenuCategoryId] =
        useState<string | null>(null);




   useEffect(() => {

    const unsubscribe =
        subscribeFeedCategories(
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
                await uploadFeedCategoryCover(
                    name,
                    file
                );



            await createFeedCategory({

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

        await updateFeedCategory(
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
    category: FeedCategory
)=>{

    if(!category.id)
        return;


    await hideFeedCategory(
        category.id
    );


    setMenuCategoryId(null);

};


const handleDeleteCategory = async (
    category: FeedCategory
)=>{

    if(!category.id)
        return;



    await deleteFeedCategory(

        category.id,

        category.storagePath

    );


    setMenuCategoryId(null);

};

const handleSaveOrder = async (
    orderedCategories: FeedCategory[]
) => {


    await updateFeedCategoryOrder(
        orderedCategories
    );


};

    return (


        <section className="feed-page">



            <div className="feed-page__header">


                <div>

                   <h2>
    Eventos
</h2>


                    <p>
    Gerencie os eventos publicados no site.
</p>


                </div>




                <div className="feed-page__actions">


    <button

        className="feed-page__button feed-page__button--secondary"

        onClick={() =>
            navigate("/feed/hidden")
        }

    >

        <EyeOff size={18}/>

        Ocultos

    </button>



    <button

    className="feed-page__button feed-page__button--secondary"

    onClick={() =>
        setShowOrderModal(true)
    }

>

        <GripVertical size={18}/>

        Organizar no Site

    </button>





    <button

        className="feed-page__new"

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






            <div className="feed-grid">



                {categories.map((category)=>(


                    <div

                        key={category.id}

                        className="feed-card"

                    >



                        <div className="feed-card__cover">


                            <img

                                src={category.cover}

                                alt={category.name}

                            />



                        </div>





                        <button

                            className="feed-card__menu"

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


                                <div className="feed-card__dropdown">


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






                        <div className="feed-card__content">

    <div className="feed-card__header">

        <h3>
            {category.name}
        </h3>

       <button
    className="feed-card__edit"
    onClick={() => {

        setEditingCategory(category);

        setShowCategoryModal(true);

    }}
>

    <Pencil size={18} />

</button>

    </div>

    <button

        className="feed-card__button"

        onClick={() =>

            navigate(
                `/feed/${category.id}`
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



            <FeedOrderModal

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


export default Feed;