import type {
    Timestamp,
} from "firebase/firestore";

export interface SiteAbout {

    id: string;

    eyebrow: string;

    title: string;

    description: string;

    backgroundUrl: string;

    backgroundStoragePath: string;

    createdAt?: Timestamp;

    updatedAt?: Timestamp;

}