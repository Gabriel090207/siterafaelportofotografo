export interface CategoryBannerImage {

    id:string;

    url:string;

    storagePath:string;

}

export interface EventCategory {

    id?:string;

    slug?:string;

    name:string;

    cover:string;

    storagePath:string;

    bannerImages?:CategoryBannerImage[];

    status:
        | "active"
        | "hidden";

    order:number;

}
