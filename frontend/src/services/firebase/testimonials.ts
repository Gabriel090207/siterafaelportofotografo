import {
    addDoc,
    collection,
    getCountFromServer,
    onSnapshot,
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


// Keep this ordering rule identical in the admin and public testimonial services.
interface OrderedTestimonial {
    id?: string;
    order?: unknown;
    createdAt?: unknown;
}

const testimonialCreatedTime = (value: unknown): number => {
    if (value instanceof Date) {
        return Number.isFinite(value.getTime()) ? value.getTime() : 0;
    }
    if (value && typeof value === "object" && "seconds" in value) {
        const { seconds } = value;
        const nanos = "nanoseconds" in value ? value.nanoseconds : 0;
        if (typeof seconds === "number" && Number.isSafeInteger(seconds)
            && typeof nanos === "number" && Number.isSafeInteger(nanos)
            && nanos >= 0 && nanos < 1e9) {
            const milliseconds = seconds * 1000 + nanos / 1e6;
            return Number.isFinite(milliseconds) && Math.abs(milliseconds) <= 8.64e15
                ? milliseconds : 0;
        }
    }
    return 0;
};

export const sortTestimonials = <T extends OrderedTestimonial>(testimonials: readonly T[]): T[] => {
    const validOrder = (value: unknown): value is number =>
        typeof value === "number" && Number.isSafeInteger(value) && value > 0;

    return [...testimonials].sort((a, b) => {
        const aOrdered = validOrder(a.order);
        const bOrdered = validOrder(b.order);
        if (aOrdered !== bOrdered) return aOrdered ? 1 : -1;
        if (validOrder(a.order) && validOrder(b.order) && a.order !== b.order) {
            return a.order - b.order;
        }
        const dateDifference = testimonialCreatedTime(b.createdAt) - testimonialCreatedTime(a.createdAt);
        if (dateDifference) return dateDifference;
        const aId = a.id ?? "";
        const bId = b.id ?? "";
        return aId < bId ? -1 : aId > bId ? 1 : 0;
    });
};

export interface Testimonial {
    order?: number;
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
    callback: (data: Testimonial[]) => void,
    onError?: (error: Error) => void,
) => {
    return onSnapshot(
        collection(db, "testimonials"),
        (snapshot) => {
            const testimonials = snapshot.docs.map((document) => ({
                ...document.data(),
                id: document.id,
            })) as Testimonial[];
            callback(
                sortTestimonials(testimonials.filter((testimonial) => testimonial.status === "active")),
            );
        },
        onError,
    );
};
