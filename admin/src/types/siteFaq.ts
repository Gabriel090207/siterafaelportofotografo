import type {
    Timestamp,
} from "firebase/firestore";

export interface SiteFaqItem {

    question: string;

    answer: string;

}

export interface SiteFaq {

    id: string;

    eyebrow: string;

    title: string;

    items: SiteFaqItem[];

    createdAt?: Timestamp;

    updatedAt?: Timestamp;

}