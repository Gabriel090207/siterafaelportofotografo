import type {
    Timestamp,
} from "firebase/firestore";

export interface SiteProcessStep {

    number: string;

    title: string;

    description: string;

}

export interface SiteProcess {

    id: string;

    eyebrow: string;

    title: string;

    steps: SiteProcessStep[];

    createdAt?: Timestamp;

    updatedAt?: Timestamp;

}