import {
    doc,
    onSnapshot,
} from "firebase/firestore";

import db from "./firestore";

export interface SitePortfolioItem {

    id: string;

    title: string;

    imageUrl?: string;

    imageStoragePath?: string;

}

export interface SitePortfolio {

    id: string;

    eyebrow: string;

    title: string;

    description: string;

    items: SitePortfolioItem[];

}

export const subscribeSitePortfolio = (
    callback: (
        data: SitePortfolio | null
    ) => void
) => {

    return onSnapshot(

        doc(
            db,
            "Site",
            "Portfolio"
        ),

        (snapshot) => {

            if (!snapshot.exists()) {

                callback(null);

                return;

            }

            callback({

                ...(snapshot.data() as Omit<
                    SitePortfolio,
                    "id"
                >),

                id: snapshot.id,

            });

        }

    );

};