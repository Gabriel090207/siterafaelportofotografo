import assert from "node:assert/strict";
import test from "node:test";

class TestImage {
    constructor(attributes) {
        this.attributes = attributes;
        this.currentSrc = attributes.currentSrc ?? attributes.currentsrc ?? "";
    }

    getAttribute(name) {
        return this.attributes[name] ?? null;
    }
}

globalThis.DOMParser = class {
    parseFromString(html) {
        const decodedText = html
            .replaceAll("&amp;", "&")
            .replaceAll("&#38;", "&")
            .replaceAll("&#x26;", "&");
        const images = [...html.matchAll(/<img\s+([^>]*?)\/?\s*>/gi)].map((match) => {
            const attributes = {};
            for (const attribute of match[1].matchAll(/([\w-]+)=["']([^"']*)["']/g)) {
                attributes[attribute[1]] = attribute[2];
            }
            return new TestImage(attributes);
        });
        return {
            documentElement: { textContent: decodedText },
            querySelectorAll: () => images,
        };
    }
};

const { extractExternalImageUrls } = await import(
    "../src/components/PhotoUploadDropZone/externalImageUrls.ts"
);
const { importExternalImages } = await import(
    "../src/components/PhotoUploadDropZone/importExternalImages.ts"
);
const { getUniqueFileName, withUniqueAlbumPhotoNames } = await import(
    "../src/utils/uniqueFileName.ts"
);

const stringItem = (type, value) => ({
    kind: "string",
    type,
    getAsString: (callback) => queueMicrotask(() => callback(value)),
});

const transfer = (data, items = []) => ({
    items,
    getData: (type) => data[type] ?? "",
});

test("extracts one, two, and five URI-list images while ignoring comments", async () => {
    for (const count of [1, 2, 5]) {
        const urls = Array.from({ length: count }, (_, index) => `https://site.test/${index + 1}.jpg`);
        assert.deepEqual(
            await extractExternalImageUrls(transfer({
                "text/uri-list": `# browser comment\n${urls.join("\n")}`,
            })),
            urls,
        );
    }
});

test("extracts every img, supports data-src fallback, rejects unsafe protocols, and deduplicates", async () => {
    const dataTransfer = transfer({
        "text/uri-list": "https://site.test/one.jpg\nhttps://site.test/one.jpg",
        "text/html": [
            '<img src="https://site.test/one.jpg">',
            '<img src="javascript:alert(1)" data-src="https://site.test/two.jpg">',
            '<img src="https://site.test/three.jpg">',
        ].join(""),
        "text/plain": "https://site.test/three.jpg\nfile:///private/photo.jpg",
    });

    assert.deepEqual(await extractExternalImageUrls(dataTransfer), [
        "https://site.test/one.jpg",
        "https://site.test/two.jpg",
        "https://site.test/three.jpg",
    ]);
});

test("chooses the richest alternate string-item representation", async () => {
    const dataTransfer = transfer({}, [
        stringItem("text/plain", "https://site.test/one.jpg"),
        stringItem("text/html", '<img src="https://site.test/two.jpg"><img src="https://site.test/three.jpg">'),
    ]);

    assert.deepEqual(await extractExternalImageUrls(dataTransfer), [
        "https://site.test/two.jpg",
        "https://site.test/three.jpg",
    ]);
});

test("does not add alternate MIME representations as separate images", async () => {
    const dataTransfer = transfer({
        "text/uri-list": "https://cdn.test/image.jpg?source=drag",
        "text/html": '<img src="https://cdn.test/image.jpg?width=1600">',
        "text/plain": "https://page.test/photo/123",
    });

    assert.deepEqual(await extractExternalImageUrls(dataTransfer), [
        "https://cdn.test/image.jpg?width=1600",
    ]);
});

test("deduplicates one image represented by items, URI list, HTML, and plain text", async () => {
    const url = "https://site.test/image.jpg?size=large";
    const dataTransfer = transfer({
        "text/uri-list": `${url}#preview`,
        "text/html": '<img src="https://site.test/image.jpg?size=large">',
        "text/plain": "https://site.test/image.jpg?size=large#dragged",
    }, [
        stringItem("text/plain", " https://site.test/image.jpg?size=large "),
        stringItem("text/html", '<img src="https://site.test/image.jpg?size=large">'),
    ]);

    assert.deepEqual(await extractExternalImageUrls(dataTransfer), [url]);
});

test("treats src and currentSrc as alternatives for the same img", async () => {
    const sameCanonicalUrl = transfer({
        "text/html": '<img currentSrc="https://site.test/image.jpg#selected" src="https://site.test/image.jpg">',
    });
    assert.deepEqual(await extractExternalImageUrls(sameCanonicalUrl), [
        "https://site.test/image.jpg#selected",
    ]);

    const sameExactUrl = transfer({
        "text/html": '<img currentSrc="https://site.test/image.jpg" src="https://site.test/image.jpg">',
    });
    assert.deepEqual(await extractExternalImageUrls(sameExactUrl), [
        "https://site.test/image.jpg",
    ]);
});

test("extracts two distinct HTML images", async () => {
    assert.deepEqual(await extractExternalImageUrls(transfer({
        "text/html": '<img src="https://site.test/one.jpg"><img src="https://site.test/two.jpg">',
    })), [
        "https://site.test/one.jpg",
        "https://site.test/two.jpg",
    ]);
});

test("deduplicates five distinct images repeated across multiple sources", async () => {
    const urls = Array.from({ length: 5 }, (_, index) => `https://site.test/${index + 1}.jpg?a=1&b=2`);
    const html = urls.map((url) => `<img src="${url.replace("&", "&amp;")}">`).join("");
    const dataTransfer = transfer({
        "text/uri-list": urls.map((url) => `${url}#preview`).join("\n"),
        "text/html": html,
        "text/plain": urls.join("\n"),
    }, [stringItem("text/html", html)]);

    assert.deepEqual(await extractExternalImageUrls(dataTransfer),
        urls);
});

test("resolves a relative HTML source against an absolute drag URL", async () => {
    const dataTransfer = transfer({
        "text/html": '<img src="../images/photo.jpg">',
        "text/plain": "https://site.test/gallery/event/",
    });

    assert.deepEqual(await extractExternalImageUrls(dataTransfer), [
        "https://site.test/gallery/images/photo.jpg",
    ]);
});

test("limits concurrency, preserves order, and keeps successes after a partial failure", async () => {
    const urls = Array.from({ length: 5 }, (_, index) => `https://site.test/${index + 1}.jpg`);
    let active = 0;
    let peak = 0;
    const progress = [];
    const importer = async (url) => {
        active += 1;
        peak = Math.max(peak, active);
        const index = urls.indexOf(url);
        await new Promise((resolve) => setTimeout(resolve, (5 - index) * 2));
        active -= 1;
        if (index === 2) throw new Error("expected failure");
        return { name: `${index + 1}.jpg` };
    };

    const result = await importExternalImages(urls, importer, (value) => progress.push(value), 3);
    assert.equal(peak, 3);
    assert.equal(result.failedCount, 1);
    assert.deepEqual(result.files.map((file) => file.name), ["1.jpg", "2.jpg", "4.jpg", "5.jpg"]);
    assert.deepEqual(progress, [1, 2, 3, 4, 5]);
});

test("finds the first available file-name suffix", () => {
    assert.equal(getUniqueFileName("foto.jpg", []), "foto.jpg");
    assert.equal(getUniqueFileName("foto.jpg", ["foto.jpg"]), "foto (1).jpg");
    assert.equal(
        getUniqueFileName("foto.jpg", ["foto.jpg", "foto (1).jpg"]),
        "foto (2).jpg",
    );
    assert.equal(
        getUniqueFileName("foto.jpg", ["foto.jpg", "foto (1).jpg", "foto (3).jpg"]),
        "foto (2).jpg",
    );
});

test("preserves extensions, multiple dots, and extensionless names", () => {
    assert.equal(getUniqueFileName("foto.png", ["foto.png"]), "foto (1).png");
    assert.equal(getUniqueFileName("foto.webp", ["foto.webp"]), "foto (1).webp");
    assert.equal(
        getUniqueFileName("imagem.final.webp", ["imagem.final.webp"]),
        "imagem.final (1).webp",
    );
    assert.equal(getUniqueFileName("imagem", ["imagem"]), "imagem (1)");
});

test("reserves names across a batch and keeps existing names unchanged", () => {
    const newPhotos = Array.from({ length: 3 }, (_, index) => ({
        id: `new-${index}`,
        name: "foto.jpg",
        preview: "blob:test",
        size: 10,
        source: "computer",
    }));

    assert.deepEqual(
        withUniqueAlbumPhotoNames(newPhotos, []).map((photo) => photo.name),
        ["foto.jpg", "foto (1).jpg", "foto (2).jpg"],
    );
    assert.deepEqual(
        withUniqueAlbumPhotoNames(newPhotos.slice(0, 2), ["foto.jpg"])
            .map((photo) => photo.name),
        ["foto (1).jpg", "foto (2).jpg"],
    );
    assert.deepEqual(
        withUniqueAlbumPhotoNames(newPhotos.slice(0, 1), ["foto.jpg", "foto (1).jpg"])
            .map((photo) => photo.name),
        ["foto (2).jpg"],
    );

    const names = withUniqueAlbumPhotoNames(newPhotos, [])
        .map((photo) => photo.name);
    const storagePaths = names.map((name) => `Fotos/${name}`);
    assert.equal(new Set(storagePaths).size, 3);
});

test("renames File metadata without changing its bytes or metadata", async () => {
    const original = new File(["image bytes"], "foto.jpg", {
        type: "image/jpeg",
        lastModified: 123456,
    });
    const [photo] = withUniqueAlbumPhotoNames([{
        id: "new-file",
        name: original.name,
        preview: "blob:test",
        size: original.size,
        source: "computer",
        file: original,
    }], ["foto.jpg"]);

    assert.equal(photo.name, "foto (1).jpg");
    assert.equal(photo.file.name, "foto (1).jpg");
    assert.equal(photo.file.size, original.size);
    assert.equal(photo.file.type, original.type);
    assert.equal(photo.file.lastModified, original.lastModified);
    assert.deepEqual(
        new Uint8Array(await photo.file.arrayBuffer()),
        new Uint8Array(await original.arrayBuffer()),
    );
});
