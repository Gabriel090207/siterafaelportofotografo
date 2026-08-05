import {
    doc,
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