import {
    doc,
    onSnapshot,
} from "firebase/firestore";

import db from "./firestore";

export interface SiteExperienceItem {

    title: string;

    description: string;

    imageUrl?: string;

    imageStoragePath?: string;

    categoryName: string;

}

export interface SiteExperiences {

    id: string;

    eyebrow: string;

    title: string;

    description: string;

    items: SiteExperienceItem[];

}

export const subscribeSiteExperiences = (
    callback: (
        data: SiteExperiences | null
    ) => void
) => {

    return onSnapshot(

        doc(
            db,
            "Site",
            "Experiences"
        ),

        (snapshot) => {

            if (!snapshot.exists()) {

                callback(null);

                return;

            }

            callback({

                ...(snapshot.data() as Omit<
                    SiteExperiences,
                    "id"
                >),

                id: snapshot.id,

            });

        }

    );

};