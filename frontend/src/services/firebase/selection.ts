import {
    collection,
    onSnapshot,
    orderBy,
    query,
} from "firebase/firestore";

import db from "./firestore";


/* ===================================
   TIPOS
=================================== */

export interface SelectionPhoto {
    name: string;
    preview: string;
}


export interface ClientSelection {
    id: string;

    clientId: string;

    selectionName: string;

    personName: string;

    email: string;

    albumId: string;

    albumName: string;

    photos: SelectionPhoto[];

    totalPhotos: number;

    status: "pending" | "completed";

    createdAt?: any;
}


/* ===================================
   LISTAR SELEÇÕES DO CLIENTE
=================================== */

export const subscribeClientSelections = (
    clientId: string,
    callback: (
        selections: ClientSelection[]
    ) => void
) => {

    const selectionsRef =
        collection(
            db,
            "clients",
            clientId,
            "selections"
        );


    const selectionsQuery =
        query(
            selectionsRef,
            orderBy(
                "createdAt",
                "desc"
            )
        );


    return onSnapshot(
        selectionsQuery,
        (snapshot) => {

            const selections =
                snapshot.docs.map(
                    (document) => {

                        const data =
                            document.data();


                        return {

                            id:
                                document.id,

                            clientId,

                            selectionName:
                                data.selectionName ?? "",

                            personName:
                                data.personName ?? "",

                            email:
                                data.email ?? "",

                            albumId:
                                data.albumId ?? "",

                            albumName:
                                data.albumName ?? "",

                            photos:
                                data.photos ?? [],

                            totalPhotos:
                                data.totalPhotos ??
                                data.photos?.length ??
                                0,

                            status:
                                data.status ?? "pending",

                            createdAt:
                                data.createdAt,

                        } as ClientSelection;

                    }
                );


            callback(
                selections
            );

        },
        (error) => {

            console.error(
                "Erro ao carregar seleções do cliente:",
                error
            );


            callback([]);

        }
    );

};