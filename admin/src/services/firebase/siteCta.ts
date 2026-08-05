import {
    doc,
    getDoc,
    onSnapshot,
    serverTimestamp,
    setDoc,
} from "firebase/firestore";

import db from "./firestore";

import type {
    SiteCta,
} from "../../types/siteCta";

export const getSiteCta = async (): Promise<SiteCta | null> => {

    const snapshot = await getDoc(

        doc(
            db,
            "Site",
            "CTA"
        )

    );

    if (!snapshot.exists()) {

        return null;

    }

    return {

        ...(snapshot.data() as Omit<
            SiteCta,
            "id"
        >),

        id: snapshot.id,

    };

};

export const subscribeSiteCta = (
    callback: (
        data: SiteCta | null
    ) => void
) => {

    return onSnapshot(

        doc(
            db,
            "Site",
            "CTA"
        ),

        (snapshot) => {

            if (!snapshot.exists()) {

                callback(null);

                return;

            }

            callback({

                ...(snapshot.data() as Omit<
                    SiteCta,
                    "id"
                >),

                id: snapshot.id,

            });

        }

    );

};

export const saveSiteCta = async (
    data: Omit<
        SiteCta,
        "id" | "createdAt" | "updatedAt"
    >
) => {

    await setDoc(

        doc(
            db,
            "Site",
            "CTA"
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