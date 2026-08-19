import api from "./client";

const IMAGE_EXTENSIONS: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
};

const externalImageFilename = (url: string, mediaType: string) => {
    const extension = IMAGE_EXTENSIONS[mediaType] ?? ".jpg";

    try {
        const pathName = new URL(url).pathname.split("/").pop() ?? "";
        const decodedName = decodeURIComponent(pathName);
        const stem = decodedName.replace(/\.[^.]*$/, "");
        const safeStem = stem
            .normalize("NFKD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9_-]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 80);

        return `${safeStem || "imagem-importada"}${extension}`;
    } catch {
        return `imagem-importada${extension}`;
    }
};

export const importExternalImage = async (url: string) => {
    const response = await api.post<Blob>(
        "/media/import-external-image",
        { url },
        { responseType: "blob" },
    );
    const contentTypeHeader = response.headers["content-type"];
    const mediaType = typeof contentTypeHeader === "string"
        ? contentTypeHeader
        : response.data.type;
    const filename = externalImageFilename(url, mediaType);

    return new File([response.data], filename, { type: mediaType });
};
