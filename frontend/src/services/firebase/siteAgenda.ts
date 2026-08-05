import {
    doc,
    onSnapshot,
} from "firebase/firestore";

import db from "./firestore";

export interface SiteAgenda {

    id: string;

    eyebrow: string;

    title: string;

    description: string;

}

export const subscribeSiteAgenda = (
    callback: (
        agenda: SiteAgenda | null
    ) => void
) => {

    return onSnapshot(

        doc(
            db,
            "Site",
            "Agenda"
        ),

        (snapshot) => {

            if (!snapshot.exists()) {

                callback(null);

                return;

            }

            callback({

                ...(snapshot.data() as Omit<
                    SiteAgenda,
                    "id"
                >),

                id: snapshot.id,

            });

        }

    );

};