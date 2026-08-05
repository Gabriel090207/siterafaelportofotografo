import type {
    Timestamp,
} from "firebase/firestore";

export interface SiteFilmFeature {

    title: string;

    description: string;

}

export interface SiteFilms {

    id: string;

    eyebrow: string;

    title: string;

    description: string;

    thumbnailUrl: string;

    thumbnailStoragePath: string;

    videoUrl: string;

    videoStoragePath: string;

    features: SiteFilmFeature[];

    createdAt?: Timestamp;

    updatedAt?: Timestamp;

}