import {
    doc,
    onSnapshot,
} from "firebase/firestore";

import db from "./firestore";

export interface SiteHero {

    id: string;

    eyebrow: string;

    title: string;

    description: string;

    backgroundUrl?: string;

    backgroundStoragePath?: string;

}

export const subscribeSiteHero = (
    callback: (
        hero: SiteHero | null
    ) => void
) => {

    return onSnapshot(

        doc(
            db,
            "Site",
            "Hero"
        ),

        (snapshot) => {

            if (!snapshot.exists()) {

                callback(null);

                return;

            }

            callback({

                ...(snapshot.data() as Omit<
                    SiteHero,
                    "id"
                >),

                id: snapshot.id,

            });

        }

    );

};