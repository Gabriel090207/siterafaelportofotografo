import type {
    Timestamp,
} from "firebase/firestore";

export interface SiteCta {

    id: string;
    
    title: string;

    description: string;

    createdAt?: Timestamp;

    updatedAt?: Timestamp;

}