import {
    collectionGroup,
    doc,
    getDoc,
    onSnapshot,
    Timestamp
} from "firebase/firestore";

import db from "./firestore";

import type {
    Selection,
} from "../../types/selection";

export const subscribeSelections = (
    callback: (selections: Selection[]) => void
) => {

    const selectionsQuery =
        collectionGroup(db, "selections");

    return onSnapshot(
        selectionsQuery,
        (snapshot) => {

            const selections: Selection[] =
                snapshot.docs.map((document) => {

                    const data =
                        document.data();

                    return {

                        id: document.id,

                        clientId:
                            data.clientId ?? "",

                        albumId:
                            data.albumId ?? "",

                        albumName:
                            data.albumName ?? "",

                        selectionName:
                            data.selectionName ?? "",

                        personName:
                            data.personName ?? "",

                        email:
                            data.email ?? "",

                        photos:
                            data.photos ?? [],

                        totalPhotos:
                            data.totalPhotos ?? 0,

                        status:
                            data.status ?? "pending",

                        createdAt:
                            data.createdAt instanceof Timestamp
                                ? data.createdAt.toDate()
                                : null,

                    };

                });

            selections.sort((a, b) => {

                const dateA =
                    a.createdAt?.getTime() ?? 0;

                const dateB =
                    b.createdAt?.getTime() ?? 0;

                return dateB - dateA;

            });

            callback(selections);

        }
    );

};


export const getSelection = async (
    clientId: string,
    selectionId: string
) => {

    const snapshot = await getDoc(
        doc(
            db,
            "clients",
            clientId,
            "selections",
            selectionId
        )
    );

    if (!snapshot.exists()) {
        return null;
    }

    const data = snapshot.data();

    return {

        id: snapshot.id,

        clientId:
            data.clientId ?? "",

        albumId:
            data.albumId ?? "",

        albumName:
            data.albumName ?? "",

        selectionName:
            data.selectionName ?? "",

        personName:
            data.personName ?? "",

        email:
            data.email ?? "",

        photos:
            data.photos ?? [],

        totalPhotos:
            data.totalPhotos ?? 0,

        status:
            data.status ?? "pending",

        createdAt:
            data.createdAt instanceof Timestamp
                ? data.createdAt.toDate()
                : null,

    };

};