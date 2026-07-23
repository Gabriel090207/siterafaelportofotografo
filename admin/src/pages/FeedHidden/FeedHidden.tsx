import "./FeedHidden.css";


import {
    ArrowLeft,
    Eye,
    Trash2,
} from "lucide-react";


import {
    useEffect,
    useState,
} from "react";


import {
    useNavigate,
} from "react-router-dom";



import {
    subscribeHiddenFeedCategories,
    restoreFeedCategory,
    deleteFeedCategory,
} from "../../services/firebase/feedCategory";


import type {
    FeedCategory,
} from "../../types/feedCategory";





const FeedHidden = () => {


    const navigate = useNavigate();



    const [categories,setCategories] =
        useState<FeedCategory[]>([]);




    useEffect(()=>{


        const unsubscribe =
            subscribeHiddenFeedCategories(
                setCategories
            );


        return unsubscribe;


    },[]);






    const handleRestore = async (
        category:FeedCategory
    )=>{


        if(!category.id)
            return;



        await restoreFeedCategory(
            category.id
        );


    };






    const handleDelete = async (
        category:FeedCategory
    )=>{


        if(!category.id)
            return;



        await deleteFeedCategory(

            category.id,

            category.storagePath

        );


    };







    return (


        <section className="feed-hidden">


            <div className="feed-hidden__header">


                <button

                    className="album-form__back"

                    onClick={() =>
                        navigate("/feed")
                    }

                >

                    <ArrowLeft size={18}/>

                    Voltar


                </button>




                <h2>

                    Categorias de Eventos Ocultas

                </h2>



                <p>

                    Gerencie as categorias de eventos ocultas temporariamente no site.

                </p>


            </div>







            {
                categories.length === 0 ? (


                    <div className="feed-hidden__empty">


                       Nenhuma categoria de evento oculta.


                    </div>


                ) : (



                    <div className="feed-hidden__grid">


                        {
                            categories.map((category)=>(


                                <div

                                    key={category.id}

                                    className="feed-hidden__card"

                                >



                                    <div className="feed-hidden__cover">


                                        <img

                                            src={category.cover}

                                            alt={category.name}

                                        />


                                    </div>






                                    <div className="feed-hidden__content">


                                        <h3>

                                            {category.name}

                                        </h3>





                                        <div className="feed-hidden__actions">



                                            <button

                                                onClick={() =>
                                                    handleRestore(category)
                                                }

                                            >

                                                <Eye size={18}/>

                                                Restaurar


                                            </button>






                                            <button

                                                className="feed-hidden__delete"

                                                onClick={() =>
                                                    handleDelete(category)
                                                }

                                            >

                                                <Trash2 size={18}/>

                                                Excluir


                                            </button>




                                        </div>



                                    </div>



                                </div>


                            ))
                        }


                    </div>


                )
            }



        </section>


    );

};


export default FeedHidden;