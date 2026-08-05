import {
    doc,
    getDoc,
    onSnapshot,
    serverTimestamp,
    setDoc,
} from "firebase/firestore";

import db from "./firestore";

import type {
    SitePortfolio,
} from "../../types/sitePortfolio";

export const getSitePortfolio = async (): Promise<SitePortfolio | null> => {

    const snapshot = await getDoc(
        doc(
            db,
            "Site",
            "Portfolio"
        )
    );

    if (!snapshot.exists()) {

        return null;

    }

    return {

        ...(snapshot.data() as Omit<
            SitePortfolio,
            "id"
        >),

        id: snapshot.id,

    };

};

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

export const saveSitePortfolio = async (
    data: Omit<
        SitePortfolio,
        "id" | "createdAt" | "updatedAt"
    >
) => {

    await setDoc(

        doc(
            db,
            "Site",
            "Portfolio"
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