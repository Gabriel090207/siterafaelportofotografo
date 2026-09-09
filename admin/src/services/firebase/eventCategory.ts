import {
    collection,
    updateDoc,
    doc,
    onSnapshot,
    query,
    where,
    getDoc,
} from "firebase/firestore";

import db from "./firestore";
import api from "../api/client";


import {
    deleteFolder,
} from "./storageService";


const categoriesRef =
    collection(
        db,
        "categories"
    );


export interface CategoryBannerImage {

    id:string;

    url:string;

    storagePath:string;

}




export interface EventCategory {

    id?: string;

    slug?: string;

    name:string;

    cover:string;

    storagePath:string;

    bannerImages?:CategoryBannerImage[];

    status:
        | "active"
        | "hidden";

    order:number;

}

export interface ResolvedEventCategory {
    categoryId: string;
    canonicalSlug: string;
    requestedIdentifier: string;
    resolvedBy: "slug" | "legacyId";
    isCanonical: boolean;
}

export interface UpdateCategoryBannerImagesResponse {
    categoryId: string;
    bannerImages: CategoryBannerImage[];
}

export const resolveEventCategory = async (
    identifier: string,
): Promise<ResolvedEventCategory> => {
    const response = await api.get<ResolvedEventCategory>(
        `/feed-categories/resolve/${encodeURIComponent(identifier)}`,
    );

    return response.data;
};

// ==============================
// Categorias ativas
// ==============================

export const subscribeEventCategories = (

    callback:
    (data:EventCategory[])=>void

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

                })) as EventCategory[];



            callback(categories);


        }

    );


};







// ==============================
// Categorias ocultas
// ==============================

export const subscribeHiddenEventCategories = (

    callback:
    (data:EventCategory[])=>void

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

                })) as EventCategory[];



            callback(categories);


        }

    );


};







// ==============================
// Criar categoria
// ==============================

export const createEventCategory = async (

    data: {

        name:string;

        cover:string;

        storagePath:string;

        order:number;

    }

)=>{


    const response = await api.post<{
        categoryId: string;
        name: string;
        slug: string;
    }>(
        "/feed-categories",
        data,
    );

    return response.data;


};







// ==============================
// Buscar categoria por ID
// ==============================

export const getEventCategory = async (

    id:string

):Promise<EventCategory | null>=>{


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

    } as EventCategory;


};







// ==============================
// Ocultar
// ==============================

export const hideEventCategory = async (

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

export const restoreEventCategory = async (

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

export const deleteEventCategory = async (

    id:string,

    storagePath:string

)=>{


    if(storagePath){


        await deleteFolder(

            storagePath

        );


    }



    await api.delete(
        `/feed-categories/${id}`
    );


};



import {
    writeBatch,
} from "firebase/firestore";

export const updateEventCategoryOrder = async (

    categories: EventCategory[]

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



export const updateEventCategory = async (
    id: string,
    data: {

        name: string;

        cover?: string;

        storagePath?: string;

    }

) => {

    const response = await api.patch<{
        categoryId: string;
        name: string;
        slug: string;
        changed: boolean;
    }>(
        `/feed-categories/${id}/slug`,
        { name: data.name },
    );

    return response.data;

};

export const updateCategoryBannerImages = async (
    categoryId: string,
    bannerImages: CategoryBannerImage[],
): Promise<UpdateCategoryBannerImagesResponse> => {
    const response = await api.put<UpdateCategoryBannerImagesResponse>(
        `/feed-categories/${encodeURIComponent(categoryId)}/banner-images`,
        { bannerImages },
    );

    return response.data;
};
