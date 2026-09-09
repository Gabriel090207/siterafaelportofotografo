import {
    addDoc,
    collection,
    getCountFromServer,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    where,
} from "firebase/firestore";

import {
    getDownloadURL,
    ref,
    uploadBytes,
} from "firebase/storage";

import db from "./firestore";
import storage from "./storage";
import { getValidSiteTestimonialsCount } from "./siteTestimonials";

export const getPublicTestimonialsCount = async (): Promise<number> => {
    const activeQuery = query(
        collection(db, "testimonials"),
        where("status", "==", "active"),
    );
    const [activeSnapshot, siteCount] = await Promise.all([
        getCountFromServer(activeQuery),
        getValidSiteTestimonialsCount(),
    ]);

    return activeSnapshot.data().count + siteCount;
};


export interface Testimonial {
    id?: string;

    name: string;
    email: string;

    photoUrl: string;
    photoStoragePath: string;

    message: string;

    status: "active" | "hidden";

    createdAt?: any;
}


export interface CreateTestimonialData {
    name: string;
    email: string;
    message: string;
    photo: File;
}


/* ===================================
   UPLOAD DA FOTO
=================================== */

const uploadTestimonialPhoto = async (
    file: File
) => {

    const extension =
        file.name
            .split(".")
            .pop();

    const uniqueName =
        `${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const storagePath =
        `Depoimentos/Fotos/${uniqueName}`;

    const storageRef =
        ref(
            storage,
            storagePath
        );

    await uploadBytes(
        storageRef,
        file
    );

    const url =
        await getDownloadURL(
            storageRef
        );

    return {
        url,
        storagePath,
    };

};


/* ===================================
   CRIAR DEPOIMENTO
=================================== */

export const createTestimonial = async (
    data: CreateTestimonialData
) => {

    const uploadedPhoto =
        await uploadTestimonialPhoto(
            data.photo
        );

    await addDoc(
        collection(
            db,
            "testimonials"
        ),
        {
            name:
                data.name.trim(),

            email:
                data.email.trim().toLowerCase(),

            message:
                data.message.trim(),

            photoUrl:
                uploadedPhoto.url,

            photoStoragePath:
                uploadedPhoto.storagePath,

            status:
                "active",

            createdAt:
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

    const q =
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
        q,
        (snapshot) => {

            const testimonials =
                snapshot.docs
                    .map(
                        (document) => ({
                            id:
                                document.id,

                            ...document.data(),
                        })
                    )
                    .filter(
                        (testimonial: any) =>
                            testimonial.status ===
                            "active"
                    ) as Testimonial[];

            callback(
                testimonials
            );

        }
    );

};
