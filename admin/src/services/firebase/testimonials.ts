import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    onSnapshot,
    serverTimestamp,
    updateDoc,
    writeBatch,
} from "firebase/firestore";

import db from "./firestore";


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
    callback: (data: Testimonial[], confirmed: boolean) => void,
    onError?: (error: Error) => void,
) => {
    return onSnapshot(
        collection(db, "testimonials"),
        { includeMetadataChanges: true },
        (snapshot) => {
            const testimonials = snapshot.docs.map((document) => ({
                ...document.data(),
                id: document.id,
            })) as Testimonial[];
            callback(
                sortTestimonials(testimonials),
                !snapshot.metadata.hasPendingWrites,
            );
        },
        onError,
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


    // Only existing editable fields are accepted; never forward a stale order.
    const payload: Partial<CreateTestimonialData> = {};
    const editableFields = [
        "name", "email", "message", "photoUrl", "photoStoragePath", "status",
    ] as const;
    for (const field of editableFields) {
        if (data[field] !== undefined) Object.assign(payload, { [field]: data[field] });
    }

    await updateDoc(
        testimonialRef,
        {
            ...payload,

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

export const updateTestimonialsOrder = async (testimonials: readonly Testimonial[]) => {
    if (!Array.isArray(testimonials)) throw new Error("Lista de depoimentos inválida.");
    if (testimonials.length > 500) {
        throw new Error("Não é possível reordenar mais de 500 depoimentos em um único lote.");
    }
    const ids = testimonials.map((testimonial) => testimonial?.id);
    if (ids.some((id) => typeof id !== "string" || !id.trim() || id.includes("/"))
        || new Set(ids).size !== ids.length) {
        throw new Error("A sequência contém IDs de depoimentos inválidos ou repetidos.");
    }
    if (testimonials.length === 0) return;
    const batch = writeBatch(db);
    testimonials.forEach((testimonial, index) => {
        batch.update(doc(db, "testimonials", testimonial.id!), { order: index + 1 });
    });
    await batch.commit();
};
