import {
    doc,
    onSnapshot,
} from "firebase/firestore";

import db from "./firestore";

export interface SiteAbout {

    id: string;

    eyebrow: string;

    title: string;

    description: string;

    backgroundUrl?: string;

    backgroundStoragePath?: string;

}

export const subscribeSiteAbout = (
    callback: (
        about: SiteAbout | null
    ) => void
) => {

    return onSnapshot(

        doc(
            db,
            "Site",
            "About"
        ),

        (snapshot) => {

            if (!snapshot.exists()) {

                callback(null);

                return;

            }

            callback({

                ...(snapshot.data() as Omit<
                    SiteAbout,
                    "id"
                >),

                id: snapshot.id,

            });

        }

    );

};