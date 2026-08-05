import {
    doc,
    getDoc,
    onSnapshot,
    serverTimestamp,
    setDoc,
} from "firebase/firestore";

import db from "./firestore";

import type {
    SiteExperiences,
} from "../../types/siteExperiences";

export const getSiteExperiences = async (): Promise<SiteExperiences | null> => {

    const snapshot = await getDoc(
        doc(
            db,
            "Site",
            "Experiences"
        )
    );

    if (!snapshot.exists()) {

        return null;

    }

    return {

        ...(snapshot.data() as Omit<
            SiteExperiences,
            "id"
        >),

        id: snapshot.id,

    };

};

export const subscribeSiteExperiences = (
    callback: (
        data: SiteExperiences | null
    ) => void
) => {

    return onSnapshot(

        doc(
            db,
            "Site",
            "Experiences"
        ),

        (snapshot) => {

            if (!snapshot.exists()) {

                callback(null);

                return;

            }

            callback({

                ...(snapshot.data() as Omit<
                    SiteExperiences,
                    "id"
                >),

                id: snapshot.id,

            });

        }

    );

};

export const saveSiteExperiences = async (
    data: Omit<
        SiteExperiences,
        "id" | "createdAt" | "updatedAt"
    >
) => {

    await setDoc(

        doc(
            db,
            "Site",
            "Experiences"
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