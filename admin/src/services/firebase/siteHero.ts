import {
    doc,
    getDoc,
    onSnapshot,
    serverTimestamp,
    setDoc,
} from "firebase/firestore";

import db from "./firestore";

import type {
    SiteHero,
} from "../../types/siteHero";

export const getSiteHero = async (): Promise<SiteHero | null> => {

    const snapshot = await getDoc(
        doc(
            db,
            "Site",
            "Hero"
        )
    );

    if (!snapshot.exists()) {

        return null;

    }

    return {

        ...(snapshot.data() as Omit<
            SiteHero,
            "id"
        >),

        id: snapshot.id,

    };

};

export const subscribeSiteHero = (
    callback: (hero: SiteHero | null) => void
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

export const saveSiteHero = async (
    hero: Omit<
        SiteHero,
        "id" | "createdAt" | "updatedAt"
    >
) => {

    await setDoc(

        doc(
            db,
            "Site",
            "Hero"
        ),

        {

            ...hero,

            createdAt: serverTimestamp(),

            updatedAt: serverTimestamp(),

        },

        {

            merge: true,

        }

    );

};