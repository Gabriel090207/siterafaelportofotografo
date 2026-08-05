import {
    doc,
    getDoc,
    onSnapshot,
    serverTimestamp,
    setDoc,
} from "firebase/firestore";

import db from "./firestore";

import type {
    SiteTestimonials,
} from "../../types/siteTestimonials";

export const getSiteTestimonials = async (): Promise<SiteTestimonials | null> => {

    const snapshot = await getDoc(

        doc(
            db,
            "Site",
            "Testimonials"
        )

    );

    if (!snapshot.exists()) {

        return null;

    }

    return {

        ...(snapshot.data() as Omit<
            SiteTestimonials,
            "id"
        >),

        id: snapshot.id,

    };

};

export const subscribeSiteTestimonials = (
    callback: (
        data: SiteTestimonials | null
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

export const saveSiteTestimonials = async (
    data: Omit<
        SiteTestimonials,
        "id" | "createdAt" | "updatedAt"
    >
) => {

    await setDoc(

        doc(
            db,
            "Site",
            "Testimonials"
        ),

        {

            ...data,

            createdAt: serverTimestamp(),

            updatedAt: serverTimestamp(),

        },

        {

            merge: true,

        }

    );

};