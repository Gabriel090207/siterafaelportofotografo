import type {
    Timestamp,
} from "firebase/firestore";

export interface SiteTestimonial {

    text: string;

    name: string;

    category: string;

}

export interface SiteTestimonials {

    id: string;

    eyebrow: string;

    title: string;

    testimonials: SiteTestimonial[];

    createdAt?: Timestamp;

    updatedAt?: Timestamp;

}