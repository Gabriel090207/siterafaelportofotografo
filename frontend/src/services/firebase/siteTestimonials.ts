import {
    doc,
    getDoc,
    onSnapshot,
} from "firebase/firestore";

import db from "./firestore";

export interface SiteTestimonial {

    text: string;

    name: string;

    category: string;

}

export interface SiteTestimonials {

    id: string;

    eyebrow: string;

    title: string;

    testimonials: SiteTestimonial[];

}

export const getValidSiteTestimonialsCount = async (): Promise<number> => {
    const snapshot = await getDoc(doc(db, "Site", "Testimonials"));
    const items: unknown = snapshot.data()?.testimonials;

    if (!Array.isArray(items)) return 0;

    return items.filter((item: unknown) => {
        if (!item || typeof item !== "object") return false;
        return ["name", "text", "category"].every((field) => {
            const value = (item as Record<string, unknown>)[field];
            return typeof value === "string" && value.trim().length > 0;
        });
    }).length;
};

export const subscribeSiteTestimonials = (
    callback: (
        testimonials: SiteTestimonials | null
    ) => void
) => {

    return onSnapshot(

        doc(
            db,
            "Site",
            "Testimonials"
        ),

        (snapshot) => {

            if (!snapshot.exists()) {

                callback(null);

                return;

            }

            callback({

                ...(snapshot.data() as Omit<
                    SiteTestimonials,
                    "id"
                >),

                id: snapshot.id,

            });

        }

    );

};
