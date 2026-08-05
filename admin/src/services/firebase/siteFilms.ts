import {
    doc,
    getDoc,
    onSnapshot,
    serverTimestamp,
    setDoc,
} from "firebase/firestore";

import db from "./firestore";

import type {
    SiteFilms,
} from "../../types/siteFilms";

export const getSiteFilms = async (): Promise<SiteFilms | null> => {

    const snapshot = await getDoc(

        doc(
            db,
            "Site",
            "Films"
        )

    );

    if (!snapshot.exists()) {

        return null;

    }

    return {

        ...(snapshot.data() as Omit<
            SiteFilms,
            "id"
        >),

        id: snapshot.id,

    };

};

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

export const saveSiteFilms = async (
    data: Omit<
        SiteFilms,
        "id" | "createdAt" | "updatedAt"
    >
) => {

    await setDoc(

        doc(
            db,
            "Site",
            "Films"
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