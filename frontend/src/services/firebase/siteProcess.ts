import {
    doc,
    onSnapshot,
} from "firebase/firestore";

import db from "./firestore";

export interface SiteProcessStep {

    number: string;

    title: string;

    description: string;

}

export interface SiteProcess {

    id: string;

    eyebrow: string;

    title: string;

    steps: SiteProcessStep[];

}

export const subscribeSiteProcess = (
    callback: (
        process: SiteProcess | null
    ) => void
) => {

    return onSnapshot(

        doc(
            db,
            "Site",
            "Process"
        ),

        (snapshot) => {

            if (!snapshot.exists()) {

                callback(null);

                return;

            }

            callback({

                ...(snapshot.data() as Omit<
                    SiteProcess,
                    "id"
                >),

                id: snapshot.id,

            });

        }

    );

};