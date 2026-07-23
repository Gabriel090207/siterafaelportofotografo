import "./FeedOrderModal.css";


import {
    X,
    GripVertical,
    Loader2,
} from "lucide-react";


import {
    useEffect,
    useState,
} from "react";


import type {
    FeedCategory,
} from "../../types/feedCategory";



import {
    DndContext,
    closestCenter,
} from "@dnd-kit/core";


import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";


import {
    CSS,
} from "@dnd-kit/utilities";





interface Props {

    open:boolean;

    categories:FeedCategory[];

    onClose:()=>void;

    onSave:(
        categories:FeedCategory[]
    )=>Promise<void>;

}







const SortableItem = ({
    item,
    index,

}:{
    item:FeedCategory;

    index:number;

})=>{


    const {

        attributes,

        listeners,

        setNodeRef,

        transform,

        transition,


    } = useSortable({

        id:item.id!

    });





    const style = {

        transform:
            CSS.Transform.toString(
                transform
            ),

        transition,

    };





    return (

        <div

            ref={setNodeRef}

            style={style}

            className="feed-order-modal__item"

        >



            <div

                className="feed-order-modal__drag"

                {...attributes}

                {...listeners}

            >

                <GripVertical size={22}/>

            </div>





            <span>

                {index + 1}

            </span>





            <strong>

                {item.name}

            </strong>



        </div>

    );


};









const FeedOrderModal = ({
    open,
    categories,
    onClose,
    onSave,

}:Props)=>{





    const [

        items,

        setItems

    ] = useState<FeedCategory[]>([]);






    const [

        saving,

        setSaving

    ] = useState(false);






    useEffect(()=>{


        setItems(
            categories
        );


    },[categories]);








    if(!open)

        return null;








    const handleSave = async()=>{


        try{


            setSaving(true);



            await onSave(

                items

            );



            onClose();



        }finally{


            setSaving(false);


        }


    };









    return (



        <div

            className="feed-order-modal"

        >



            <div

                className="feed-order-modal__backdrop"

                onClick={onClose}

            />







            <div

                className="feed-order-modal__card"

            >





                <button

                    className="feed-order-modal__close"

                    onClick={onClose}

                >

                    <X size={20}/>


                </button>







                <h2>

                    Organizar no Site

                </h2>






                <p>

                    Arraste as categorias para definir a ordem que aparecerão no site.

                </p>









                <div

                    className="feed-order-modal__list"

                >




                    <DndContext

                        collisionDetection={
                            closestCenter
                        }


                        onDragEnd={(event)=>{


                            const {

                                active,

                                over


                            } = event;





                            if(

                                !over ||

                                active.id === over.id

                            )

                                return;






                            setItems((current)=>{



                                const oldIndex =

                                    current.findIndex(

                                        item =>

                                        item.id === active.id

                                    );





                                const newIndex =

                                    current.findIndex(

                                        item =>

                                        item.id === over.id

                                    );







                                return arrayMove(

                                    current,

                                    oldIndex,

                                    newIndex

                                );



                            });



                        }}

                    >






                        <SortableContext


                            items={

                                items.map(

                                    item => item.id!

                                )

                            }



                            strategy={

                                verticalListSortingStrategy

                            }


                        >





                            {

                                items.map(

                                    (
                                        item,

                                        index

                                    )=>(



                                        <SortableItem

                                            key={
                                                item.id
                                            }

                                            item={
                                                item
                                            }

                                            index={
                                                index
                                            }


                                        />



                                    )

                                )

                            }





                        </SortableContext>





                    </DndContext>





                </div>









                <button

                    className="feed-order-modal__save"

                    onClick={handleSave}

                    disabled={saving}

                >




                    {

                        saving ? (


                            <>

                                <Loader2 className="spin"/>

                                Salvando...


                            </>


                        ) : (


                            "Salvar Ordem"


                        )


                    }





                </button>







            </div>






        </div>


    );


};





export default FeedOrderModal;