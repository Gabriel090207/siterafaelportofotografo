export interface Client {

    id: string;

    uid?: string;

    name: string;

    email: string;

    phone: string;

    albumsCount: number;

    active: boolean;

    createdAt: Date;

    updatedAt: Date;

    role: "client";

}