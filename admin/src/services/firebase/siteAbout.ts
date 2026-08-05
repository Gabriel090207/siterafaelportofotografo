import {
    doc,
    getDoc,
    onSnapshot,
    serverTimestamp,
    setDoc,
} from "firebase/firestore";

import db from "./firestore";

import type {
    SiteAbout,
} from "../../types/siteAbout";

export const getSiteAbout = async (): Promise<SiteAbout | null> => {

    const snapshot = await getDoc(

        doc(
            db,
            "Site",
            "About"
        )

    );

    if (!snapshot.exists()) {

        return null;

    }

    return {

        ...(snapshot.data() as Omit<
            SiteAbout,
            "id"
        >),

        id: snapshot.id,

    };

};

export const subscribeSiteAbout = (
    callback: (
        data: SiteAbout | null
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

export const saveSiteAbout = async (
    data: Omit<
        SiteAbout,
        "id" | "createdAt" | "updatedAt"
    >
) => {

    await setDoc(

        doc(
            db,
            "Site",
            "About"
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