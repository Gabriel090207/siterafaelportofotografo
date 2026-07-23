export interface FeedCategory {

    id?:string;

    name:string;

    cover:string;

    storagePath:string;

    status:
        | "active"
        | "hidden";

    order:number;

}