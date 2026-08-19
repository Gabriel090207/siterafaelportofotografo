import "./HiddenEvents.css";


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
    subscribeHiddenEventCategories,
    restoreEventCategory,
    deleteEventCategory,
} from "../../services/firebase/eventCategory";


import type {
    EventCategory,
} from "../../types/eventCategory";





const HiddenEvents = () => {


    const navigate = useNavigate();



    const [categories,setCategories] =
        useState<EventCategory[]>([]);




    useEffect(()=>{


        const unsubscribe =
            subscribeHiddenEventCategories(
                setCategories
            );


        return unsubscribe;


    },[]);






    const handleRestore = async (
        category:EventCategory
    )=>{


        if(!category.id)
            return;



        await restoreEventCategory(
            category.id
        );


    };






    const handleDelete = async (
        category:EventCategory
    )=>{


        if(!category.id)
            return;



        await deleteEventCategory(

            category.id,

            category.storagePath

        );


    };







    return (


        <section className="hidden-events">


            <div className="hidden-events__header">


                <button

                    className="album-form__back"

                    onClick={() =>
                        navigate("/eventos")
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


                    <div className="hidden-events__empty">


                       Nenhuma categoria de evento oculta.


                    </div>


                ) : (



                    <div className="hidden-events__grid">


                        {
                            categories.map((category)=>(


                                <div

                                    key={category.id}

                                    className="hidden-events__card"

                                >



                                    <div className="hidden-events__cover">


                                        <img

                                            src={category.cover}

                                            alt={category.name}

                                        />


                                    </div>






                                    <div className="hidden-events__content">


                                        <h3>

                                            {category.name}

                                        </h3>





                                        <div className="hidden-events__actions">



                                            <button

                                                onClick={() =>
                                                    handleRestore(category)
                                                }

                                            >

                                                <Eye size={18}/>

                                                Restaurar


                                            </button>






                                            <button

                                                className="hidden-events__delete"

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


export default HiddenEvents;
