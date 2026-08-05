import {
    doc,
    getDoc,
    onSnapshot,
    serverTimestamp,
    setDoc,
} from "firebase/firestore";

import db from "./firestore";

import type {
    SiteFaq,
} from "../../types/siteFaq";

export const getSiteFaq = async (): Promise<SiteFaq | null> => {

    const snapshot = await getDoc(

        doc(
            db,
            "Site",
            "FAQ"
        )

    );

    if (!snapshot.exists()) {

        return null;

    }

    return {

        ...(snapshot.data() as Omit<
            SiteFaq,
            "id"
        >),

        id: snapshot.id,

    };

};

export const subscribeSiteFaq = (
    callback: (
        data: SiteFaq | null
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

export const saveSiteFaq = async (
    data: Omit<
        SiteFaq,
        "id" | "createdAt" | "updatedAt"
    >
) => {

    await setDoc(

        doc(
            db,
            "Site",
            "FAQ"
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