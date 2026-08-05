import {
    collection,
    onSnapshot,
    query,
    where,
} from "firebase/firestore";

import db from "./firestore";

export interface FeedCategory {
    id?: string;
    name: string;
    cover: string;
    storagePath: string;
    status: "active" | "hidden";
    order: number;
}

export const subscribeFeedCategories = (
    callback: (data: FeedCategory[]) => void
) => {
    const q = query(
        collection(db, "categories"),
        where("status", "==", "active")
    );

    return onSnapshot(q, (snapshot) => {
        const categories = snapshot.docs
            .map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }) as FeedCategory)
            .sort(
                (a, b) =>
                    (a.order ?? 999) -
                    (b.order ?? 999)
            );

        callback(categories);
    });
};