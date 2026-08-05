import {
    doc,
    getDoc,
    onSnapshot,
    serverTimestamp,
    setDoc,
} from "firebase/firestore";

import db from "./firestore";

import type {
    SiteAgenda,
} from "../../types/siteAgenda";

export const getSiteAgenda = async (): Promise<SiteAgenda | null> => {

    const snapshot = await getDoc(

        doc(
            db,
            "Site",
            "Agenda"
        )

    );

    if (!snapshot.exists()) {

        return null;

    }

    return {

        ...(snapshot.data() as Omit<
            SiteAgenda,
            "id"
        >),

        id: snapshot.id,

    };

};

export const subscribeSiteAgenda = (
    callback: (
        data: SiteAgenda | null
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

export const saveSiteAgenda = async (
    data: Omit<
        SiteAgenda,
        "id" | "createdAt" | "updatedAt"
    >
) => {

    await setDoc(

        doc(
            db,
            "Site",
            "Agenda"
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