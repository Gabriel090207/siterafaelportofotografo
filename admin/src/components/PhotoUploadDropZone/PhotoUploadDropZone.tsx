import "./PhotoUploadDropZone.css";

import {
    useEffect,
    useRef,
    useState,
    type DragEvent,
    type ReactNode,
} from "react";

interface PhotoUploadDropZoneProps {
    children: ReactNode;
    className: string;
    onFiles: (files: File[]) => void;
    onExternalImageUrl: (url: string) => Promise<void>;
}

const SUPPORTED_DROP_TYPES = [
    "Files",
    "text/uri-list",
    "text/html",
    "text/plain",
];

const hasSupportedDropData = (event: DragEvent<HTMLElement>) =>
    Array.from(event.dataTransfer.types).some((type) =>
        SUPPORTED_DROP_TYPES.includes(type)
    );

const validHttpUrl = (value: string) => {
    try {
        const url = new URL(value.trim());
        return url.protocol === "http:" || url.protocol === "https:"
            ? url.href
            : null;
    } catch {
        return null;
    }
};

const externalImageUrl = (dataTransfer: DataTransfer) => {
    const uriList = dataTransfer
        .getData("text/uri-list")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find((line) => line && !line.startsWith("#"));
    const uriListUrl = uriList ? validHttpUrl(uriList) : null;

    if (uriListUrl) return uriListUrl;

    const html = dataTransfer.getData("text/html");
    if (html) {
        const imageSource = new DOMParser()
            .parseFromString(html, "text/html")
            .querySelector("img")
            ?.getAttribute("src");
        const htmlUrl = imageSource ? validHttpUrl(imageSource) : null;

        if (htmlUrl) return htmlUrl;
    }

    const plainText = dataTransfer.getData("text/plain").trim();
    return plainText ? validHttpUrl(plainText) : null;
};

const PhotoUploadDropZone = ({
    children,
    className,
    onFiles,
    onExternalImageUrl,
}: PhotoUploadDropZoneProps) => {
    const [isDraggingFiles, setIsDraggingFiles] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importError, setImportError] = useState("");
    const dragDepthRef = useRef(0);
    const importingRef = useRef(false);
    const errorTimerRef = useRef<number | null>(null);

    useEffect(() => () => {
        if (errorTimerRef.current !== null) {
            window.clearTimeout(errorTimerRef.current);
        }
    }, []);

    const showImportError = (message: string) => {
        if (errorTimerRef.current !== null) {
            window.clearTimeout(errorTimerRef.current);
        }

        setImportError(message);
        errorTimerRef.current = window.setTimeout(() => {
            setImportError("");
            errorTimerRef.current = null;
        }, 4000);
    };

    const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
        if (!hasSupportedDropData(event)) return;

        event.preventDefault();
        dragDepthRef.current += 1;
        setIsDraggingFiles(true);
    };

    const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
        if (!hasSupportedDropData(event)) return;

        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
    };

    const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
        if (!hasSupportedDropData(event)) return;

        event.preventDefault();
        dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);

        if (dragDepthRef.current === 0) {
            setIsDraggingFiles(false);
        }
    };

    const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
        if (!hasSupportedDropData(event)) return;

        event.preventDefault();
        dragDepthRef.current = 0;
        setIsDraggingFiles(false);

        if (importingRef.current) return;

        const imageFiles = Array.from(event.dataTransfer.files).filter(
            (file) => file.type.startsWith("image/"),
        );

        if (imageFiles.length > 0) {
            onFiles(imageFiles);
            return;
        }

        const imageUrl = externalImageUrl(event.dataTransfer);
        if (!imageUrl) {
            showImportError("Não foi possível identificar uma imagem válida.");
            return;
        }

        setImportError("");
        importingRef.current = true;
        setIsImporting(true);

        try {
            await onExternalImageUrl(imageUrl);
        } catch {
            showImportError("Não foi possível importar esta imagem.");
        } finally {
            importingRef.current = false;
            setIsImporting(false);
        }
    };

    const feedbackVisible = isDraggingFiles || isImporting || Boolean(importError);
    const feedbackMessage = isImporting
        ? "Importando imagem..."
        : importError || "Solte as fotos aqui";

    return (
        <div
            className={`${className} photo-upload-drop-zone${
                isDraggingFiles ? " photo-upload-drop-zone--active" : ""
            }${isImporting ? " photo-upload-drop-zone--importing" : ""}${
                importError ? " photo-upload-drop-zone--error" : ""
            }`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            aria-busy={isImporting}
        >
            {children}

            <div
                className="photo-upload-drop-zone__feedback"
                aria-live="polite"
                aria-hidden={!feedbackVisible}
            >
                {feedbackMessage}
            </div>
        </div>
    );
};

export default PhotoUploadDropZone;
