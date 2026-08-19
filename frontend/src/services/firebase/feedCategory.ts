import {
    collection,
    onSnapshot,
    query,
    where,
} from "firebase/firestore";

import db from "./firestore";

export interface FeedCategory {
    id?: string;
    slug?: string;
    name: string;
    cover: string;
    storagePath: string;
    status: "active" | "hidden";
    order: number;
}

export interface PublicFeedCategoryResponse {
    categoryId: string;
    name: string;
    canonicalSlug: string;
    requestedSlug: string;
    isCanonical: boolean;
}

export const getPublicFeedCategory = async (
    slug: string,
): Promise<PublicFeedCategoryResponse | null> => {
    const response = await fetch(
        `${import.meta.env.VITE_API_URL}/public/feed-categories/${encodeURIComponent(slug)}`
    );

    if (response.status === 404) return null;

    if (!response.ok) {
        throw new Error("Não foi possível carregar a categoria.");
    }

    return response.json();
};

export const subscribeFeedCategories = (
    callback: (data: FeedCategory[]) => void,
    onError?: (error: Error) => void,
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
    }, onError);
};
