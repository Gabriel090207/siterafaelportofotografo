import type {
    Timestamp,
} from "firebase/firestore";

export interface SiteExperienceItem {

    id: string;

    title: string;

    description: string;

    imageUrl?: string;

    imageStoragePath?: string;

    categoryName: string;

    categoryId?: string;

}

export interface SiteExperiences {

    id: string;

    eyebrow: string;

    title: string;

    description: string;

    items: SiteExperienceItem[];

    createdAt?: Timestamp;

    updatedAt?: Timestamp;

}
