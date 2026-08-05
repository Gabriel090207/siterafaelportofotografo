import {
    doc,
    onSnapshot,
} from "firebase/firestore";

import db from "./firestore";

export interface SiteFaqItem {

    question: string;

    answer: string;

}

export interface SiteFaq {

    id: string;

    eyebrow: string;

    title: string;

    items: SiteFaqItem[];

}

export const subscribeSiteFaq = (
    callback: (
        faq: SiteFaq | null
    ) => void
) => {

    return onSnapshot(

        doc(
            db,
            "Site",
            "FAQ"
        ),

        (snapshot) => {

            if (!snapshot.exists()) {

                callback(null);

                return;

            }

            callback({

                ...(snapshot.data() as Omit<
                    SiteFaq,
                    "id"
                >),

                id: snapshot.id,

            });

        }

    );

};