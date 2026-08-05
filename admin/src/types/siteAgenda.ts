import type {
    Timestamp,
} from "firebase/firestore";

export interface SiteAgenda {

    id: string;

    eyebrow: string;

    title: string;

    description: string;

    createdAt?: Timestamp;

    updatedAt?: Timestamp;

}