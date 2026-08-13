import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";

import db from "./firestore";


export interface Testimonial {
    id?: string;

    name: string;
    email: string;

    message: string;

    photoUrl: string;
    photoStoragePath: string;

    status: "active" | "hidden";

    createdAt?: any;
    updatedAt?: any;
}


export interface CreateTestimonialData {
    name: string;
    email: string;

    message: string;

    photoUrl: string;
    photoStoragePath: string;

    status: "active" | "hidden";
}


/* ===================================
   CRIAR DEPOIMENTO
=================================== */

export const createTestimonial = async (
    data: CreateTestimonialData
) => {

    return await addDoc(
        collection(
            db,
            "testimonials"
        ),
        {
            name:
                data.name.trim(),

            email:
                data.email
                    .trim()
                    .toLowerCase(),

            message:
                data.message.trim(),

            photoUrl:
                data.photoUrl,

            photoStoragePath:
                data.photoStoragePath,

            status:
                data.status,

            createdAt:
                serverTimestamp(),

            updatedAt:
                serverTimestamp(),
        }
    );

};


/* ===================================
   LISTAR DEPOIMENTOS
=================================== */

export const subscribeTestimonials = (
    callback: (
        data: Testimonial[]
    ) => void
) => {

    const testimonialsQuery =
        query(
            collection(
                db,
                "testimonials"
            ),
            orderBy(
                "createdAt",
                "desc"
            )
        );


    return onSnapshot(
        testimonialsQuery,
        (snapshot) => {

            const testimonials =
                snapshot.docs.map(
                    (document) => ({

                        id:
                            document.id,

                        ...document.data(),

                    })
                ) as Testimonial[];


            callback(
                testimonials
            );

        }
    );

};


/* ===================================
BUSCAR DEPOIMENTO POR ID
=================================== */

export const getTestimonialById = async (
    id: string
): Promise<Testimonial | null> => {

    const testimonialRef =
        doc(
            db,
            "testimonials",
            id
        );

    const testimonialSnapshot =
        await getDoc(
            testimonialRef
        );


    if (
        !testimonialSnapshot.exists()
    ) {
        return null;
    }


    return {
        id:
            testimonialSnapshot.id,

        ...testimonialSnapshot.data(),

    } as Testimonial;

};

/* ===================================
   ATUALIZAR DEPOIMENTO
=================================== */

export const updateTestimonial = async (
    id: string,
    data: Partial<CreateTestimonialData>
) => {

    const testimonialRef =
        doc(
            db,
            "testimonials",
            id
        );


    await updateDoc(
        testimonialRef,
        {
            ...data,

            updatedAt:
                serverTimestamp(),
        }
    );

};


/* ===================================
   EXCLUIR DEPOIMENTO
=================================== */

export const deleteTestimonial = async (
    id: string
) => {

    await deleteDoc(
        doc(
            db,
            "testimonials",
            id
        )
    );

};