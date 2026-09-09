const TEXT_DROP_TYPES = new Set([
    "text/uri-list",
    "text/html",
    "text/plain",
]);

const DROP_TYPE_PRIORITY = ["text/html", "text/uri-list", "text/plain"];

const decodeHtmlEntities = (value: string) => {
    if (!value.includes("&")) return value;
    const document = new DOMParser().parseFromString(value, "text/html");
    return document.documentElement.textContent ?? value;
};

const validHttpUrl = (value: string, baseUrl?: string) => {
    try {
        const normalizedValue = decodeHtmlEntities(value).trim();
        const url = baseUrl
            ? new URL(normalizedValue, baseUrl)
            : new URL(normalizedValue);
        return url.protocol === "http:" || url.protocol === "https:"
            ? url.href
            : null;
    } catch {
        return null;
    }
};

const urlsFromLines = (value: string, ignoreComments = false) =>
    value
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && (!ignoreComments || !line.startsWith("#")))
        .map((line) => validHttpUrl(line))
        .filter((url): url is string => Boolean(url));

const urlsFromHtml = (html: string, baseUrl?: string) => {
    const document = new DOMParser().parseFromString(html, "text/html");

    return Array.from(document.querySelectorAll("img")).flatMap((image) => {
        const candidates = [
            image.currentSrc,
            image.getAttribute("currentSrc"),
            image.getAttribute("src"),
            image.getAttribute("data-src"),
        ];

        for (const candidate of candidates) {
            if (!candidate) continue;
            const url = validHttpUrl(candidate, baseUrl);
            if (url) return [url];
        }

        return [];
    });
};

const urlsFromPayload = (type: string, value: string, baseUrl?: string) => {
    switch (type.toLowerCase()) {
        case "text/uri-list":
            return urlsFromLines(value, true);
        case "text/html":
            return urlsFromHtml(value, baseUrl);
        case "text/plain":
            return urlsFromLines(value);
        default:
            return [];
    }
};

const canonicalUrlKey = (value: string) => {
    const url = new URL(value);
    url.hash = "";
    return url.href;
};

const readStringItem = (item: DataTransferItem) =>
    new Promise<string>((resolve) => item.getAsString(resolve));

export const extractExternalImageUrls = async (dataTransfer: DataTransfer) => {
    const payloads: Array<Promise<{ type: string; value: string }>> = [];
    const globalPayloads: Array<{ type: string; value: string }> = [];

    // Start every asynchronous item read while the drop event still owns access
    // to the DataTransfer store. Some browsers revoke it after the handler yields.
    for (const item of Array.from(dataTransfer.items)) {
        const type = item.type.toLowerCase();
        if (item.kind !== "string" || !TEXT_DROP_TYPES.has(type)) continue;
        payloads.push(
            readStringItem(item).then((value) => ({ type, value })),
        );
    }

    // Read global payloads synchronously for the same reason as item reads.
    for (const type of TEXT_DROP_TYPES) {
        const value = dataTransfer.getData(type);
        if (value) globalPayloads.push({ type, value });
    }

    const itemPayloads = await Promise.all(payloads);
    // getData is needed too: browsers commonly expose one aggregate value per
    // format even when they do not expose equivalent string items.
    const allPayloads = [...itemPayloads, ...globalPayloads];
    const baseUrl = allPayloads
        .filter(({ type }) => type !== "text/html")
        .flatMap(({ type, value }) => urlsFromPayload(type, value))
        .at(0);

    const urlsByType = new Map<string, string[]>();
    const seenByType = new Map<string, Set<string>>();

    for (const { type, value } of allPayloads) {
        const urls = urlsByType.get(type) ?? [];
        const seen = seenByType.get(type) ?? new Set<string>();

        for (const url of urlsFromPayload(type, value, baseUrl)) {
            const key = canonicalUrlKey(url);
            if (seen.has(key)) continue;
            seen.add(key);
            urls.push(url);
        }

        urlsByType.set(type, urls);
        seenByType.set(type, seen);
    }

    // MIME string items are alternate representations of the same drag data,
    // not independent image collections. Use the richest representation and,
    // on ties, prefer HTML because it explicitly identifies image elements.
    return DROP_TYPE_PRIORITY
        .map((type) => urlsByType.get(type) ?? [])
        .reduce<string[]>((selected, urls) =>
            urls.length > selected.length ? urls : selected
        , []);
};
