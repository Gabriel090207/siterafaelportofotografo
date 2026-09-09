import type { AlbumPhoto } from "../types/eventAlbum";

const comparisonKey = (name: string) => name.toLocaleLowerCase();

const splitFileName = (name: string) => {
    const lastDot = name.lastIndexOf(".");
    const hasExtension = lastDot > 0 && lastDot < name.length - 1;

    return hasExtension
        ? { stem: name.slice(0, lastDot), extension: name.slice(lastDot) }
        : { stem: name, extension: "" };
};

export const getUniqueFileName = (
    desiredName: string,
    existingNames: Iterable<string>,
) => {
    const usedNames = new Set(Array.from(existingNames, comparisonKey));
    if (!usedNames.has(comparisonKey(desiredName))) return desiredName;

    const { stem, extension } = splitFileName(desiredName);
    let suffix = 1;

    while (usedNames.has(comparisonKey(`${stem} (${suffix})${extension}`))) {
        suffix += 1;
    }

    return `${stem} (${suffix})${extension}`;
};

const renameFile = (file: File, name: string) =>
    file.name === name
        ? file
        : new File([file], name, {
            type: file.type,
            lastModified: file.lastModified,
        });

export const withUniqueAlbumPhotoNames = (
    newPhotos: AlbumPhoto[],
    existingNames: Iterable<string>,
) => {
    const reservedNames = new Set(existingNames);

    return newPhotos.map((photo) => {
        const name = getUniqueFileName(photo.name, reservedNames);
        reservedNames.add(name);

        if (name === photo.name) return photo;

        return {
            ...photo,
            name,
            file: photo.file ? renameFile(photo.file, name) : undefined,
        };
    });
};

