export interface SelectionPhoto {

    name: string;

    preview: string;

}

export interface Selection {

    id?: string;

    clientId: string;

    albumId: string;

    albumName: string;

    selectionName: string;

    personName: string;

    email: string;

    photos: SelectionPhoto[];

    totalPhotos: number;

    status: string;

    createdAt: Date | null;

}