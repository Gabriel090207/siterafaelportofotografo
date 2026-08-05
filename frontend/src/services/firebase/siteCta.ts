import {
    doc,
    onSnapshot,
} from "firebase/firestore";

import db from "./firestore";

export interface SiteCta {

    id: string;

    title: string;

    description: string;

}

export const subscribeSiteCta = (
    callback: (
        cta: SiteCta | null
    ) => void
) => {

    return onSnapshot(

        doc(
            db,
            "Site",
            "CTA"
        ),

        (snapshot) => {

            if (!snapshot.exists()) {

                callback(null);

                return;

            }

            callback({

                ...(snapshot.data() as Omit<
                    SiteCta,
                    "id"
                >),

                id: snapshot.id,

            });

        }

    );

};