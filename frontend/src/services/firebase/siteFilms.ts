import {
    doc,
    onSnapshot,
} from "firebase/firestore";

import db from "./firestore";

export interface SiteFilmFeature {

    title: string;

    description: string;

}

export interface SiteFilms {

    id: string;

    eyebrow: string;

    title: string;

    description: string;

    thumbnailUrl: string;

    thumbnailStoragePath: string;

    videoUrl: string;

    videoStoragePath: string;

    features: SiteFilmFeature[];

}

export const subscribeSiteFilms = (
    callback: (
        data: SiteFilms | null
    ) => void
) => {

    return onSnapshot(

        doc(
            db,
            "Site",
            "Films"
        ),

        (snapshot) => {

            if (!snapshot.exists()) {

                callback(null);

                return;

            }

            callback({

                ...(snapshot.data() as Omit<
                    SiteFilms,
                    "id"
                >),

                id: snapshot.id,

            });

        }

    );

};