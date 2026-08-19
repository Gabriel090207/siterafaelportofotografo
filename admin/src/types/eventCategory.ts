export interface EventCategory {

    id?:string;

    slug?:string;

    name:string;

    cover:string;

    storagePath:string;

    status:
        | "active"
        | "hidden";

    order:number;

}
