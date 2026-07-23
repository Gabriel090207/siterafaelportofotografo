import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    where,
    getDoc,
} from "firebase/firestore";

import db from "./firestore";


import {
    deleteFolder,
} from "./storageService";


const categoriesRef =
    collection(
        db,
        "categories"
    );





export interface FeedCategory {

    id?: string;

    name:string;

    cover:string;

    storagePath:string;

    status:
        | "active"
        | "hidden";

    order:number;

}

// ==============================
// Categorias ativas
// ==============================

export const subscribeFeedCategories = (

    callback:
    (data:FeedCategory[])=>void

)=>{


    const q = query(

        categoriesRef,

        where(
            "status",
            "==",
            "active"
        )

    );



    return onSnapshot(

        q,

        (snapshot)=>{


            const categories =
                snapshot.docs.map(doc=>({

                    id:doc.id,

                    ...doc.data()

                })) as FeedCategory[];



            callback(categories);


        }

    );


};







// ==============================
// Categorias ocultas
// ==============================

export const subscribeHiddenFeedCategories = (

    callback:
    (data:FeedCategory[])=>void

)=>{


    const q = query(

        categoriesRef,

        where(
            "status",
            "==",
            "hidden"
        )

    );



    return onSnapshot(

        q,

        (snapshot)=>{


            const categories =
                snapshot.docs.map(doc=>({

                    id:doc.id,

                    ...doc.data()

                })) as FeedCategory[];



            callback(categories);


        }

    );


};







// ==============================
// Criar categoria
// ==============================

export const createFeedCategory = async (

    data: {

        name:string;

        cover:string;

        storagePath:string;

        order:number;

    }

)=>{


    return addDoc(

        categoriesRef,

        {

            ...data,

            status:"active",

        }

    );


};







// ==============================
// Buscar categoria por ID
// ==============================

export const getFeedCategory = async (

    id:string

):Promise<FeedCategory | null>=>{


    const snapshot =
        await getDoc(

            doc(
                db,
                "categories",
                id
            )

        );



    if(!snapshot.exists()){

        return null;

    }



    return {

        id:snapshot.id,

        ...snapshot.data()

    } as FeedCategory;


};







// ==============================
// Ocultar
// ==============================

export const hideFeedCategory = async (

    id:string

)=>{


    await updateDoc(

        doc(
            db,
            "categories",
            id
        ),

        {

            status:"hidden"

        }

    );


};







// ==============================
// Restaurar
// ==============================

export const restoreFeedCategory = async (

    id:string

)=>{


    await updateDoc(

        doc(
            db,
            "categories",
            id
        ),

        {

            status:"active"

        }

    );


};







// ==============================
// Excluir definitivo
// ==============================

export const deleteFeedCategory = async (

    id:string,

    storagePath:string

)=>{


    if(storagePath){


        await deleteFolder(

            storagePath

        );


    }



    await deleteDoc(

        doc(
            db,
            "categories",
            id
        )

    );


};



import {
    writeBatch,
} from "firebase/firestore";

export const updateFeedCategoryOrder = async (

    categories: FeedCategory[]

)=>{


    const batch =
        writeBatch(db);



    categories.forEach(
        (
            category,
            index
        )=>{


            if(!category.id)
                return;



            batch.update(

                doc(
                    db,
                    "categories",
                    category.id
                ),

                {

                    order:
                        index + 1

                }

            );


        }

    );



    await batch.commit();


};



export const updateFeedCategory = async (
    id: string,
    data: {

        name: string;

        cover?: string;

        storagePath?: string;

    }

) => {

    const ref = doc(
    db,
    "categories",
    id
);

    await updateDoc(
        ref,
        data
    );

};