import type { AlbumPhoto } from "../types/eventAlbum";

const createAlbumPhotos = (files: File[]): AlbumPhoto[] =>
    files
        .filter((file) => file.type.startsWith("image/"))
        .map((file) => ({
            id: crypto.randomUUID(),
            file,
            preview: URL.createObjectURL(file),
            name: file.name,
            size: file.size,
            source: "computer",
        }));

export default createAlbumPhotos;
