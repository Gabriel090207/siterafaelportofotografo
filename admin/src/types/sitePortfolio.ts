import type {
    Timestamp,
} from "firebase/firestore";

export interface SitePortfolioItem {

    id: string;

    title: string;

    imageUrl?: string;

    imageStoragePath?: string;

}

export interface SitePortfolio {

    id: string;

    eyebrow: string;

    title: string;

    description: string;

    items: SitePortfolioItem[];

    createdAt?: Timestamp;

    updatedAt?: Timestamp;

}