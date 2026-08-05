import {
    doc,
    getDoc,
    onSnapshot,
    serverTimestamp,
    setDoc,
} from "firebase/firestore";

import db from "./firestore";

import type {
    SiteProcess,
} from "../../types/siteProcess";

export const getSiteProcess = async (): Promise<SiteProcess | null> => {

    const snapshot = await getDoc(

        doc(
            db,
            "Site",
            "Process"
        )

    );

    if (!snapshot.exists()) {

        return null;

    }

    return {

        ...(snapshot.data() as Omit<
            SiteProcess,
            "id"
        >),

        id: snapshot.id,

    };

};

export const subscribeSiteProcess = (
    callback: (
        data: SiteProcess | null
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

export const saveSiteProcess = async (
    data: Omit<
        SiteProcess,
        "id" | "createdAt" | "updatedAt"
    >
) => {

    await setDoc(

        doc(
            db,
            "Site",
            "Process"
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