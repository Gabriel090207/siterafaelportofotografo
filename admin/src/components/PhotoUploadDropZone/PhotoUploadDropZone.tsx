import "./PhotoUploadDropZone.css";

import {
    useEffect,
    useRef,
    useState,
    type DragEvent,
    type ReactNode,
} from "react";
import { extractExternalImageUrls } from "./externalImageUrls";
import { importExternalImages } from "./importExternalImages";

interface PhotoUploadDropZoneProps {
    children: ReactNode;
    className: string;
    onFiles: (files: File[]) => void;
    onExternalImageUrl: (url: string) => Promise<File>;
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

const IMPORT_CONCURRENCY = 4;

const PhotoUploadDropZone = ({
    children,
    className,
    onFiles,
    onExternalImageUrl,
}: PhotoUploadDropZoneProps) => {
    const [isDraggingFiles, setIsDraggingFiles] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState({ completed: 0, total: 0 });
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
        event.stopPropagation();
        dragDepthRef.current += 1;
        setIsDraggingFiles(true);
    };

    const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
        if (!hasSupportedDropData(event)) return;

        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = "copy";
    };

    const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
        if (!hasSupportedDropData(event)) return;

        event.preventDefault();
        event.stopPropagation();
        dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);

        if (dragDepthRef.current === 0) {
            setIsDraggingFiles(false);
        }
    };

    const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
        if (!hasSupportedDropData(event)) return;

        event.preventDefault();
        event.stopPropagation();
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

        importingRef.current = true;
        let imageUrls: string[];
        try {
            imageUrls = await extractExternalImageUrls(event.dataTransfer);
        } catch {
            importingRef.current = false;
            showImportError("Não foi possível identificar uma imagem válida.");
            return;
        }
        if (imageUrls.length === 0) {
            importingRef.current = false;
            showImportError("Não foi possível identificar uma imagem válida.");
            return;
        }

        setImportError("");
        setIsImporting(true);
        setImportProgress({ completed: 0, total: imageUrls.length });

        try {
            const { files: importedFiles, failedCount } = await importExternalImages(
                imageUrls,
                onExternalImageUrl,
                (completed) => setImportProgress({
                    completed,
                    total: imageUrls.length,
                }),
                IMPORT_CONCURRENCY,
            );
            if (importedFiles.length > 0) onFiles(importedFiles);

            if (failedCount > 0) {
                showImportError(
                    failedCount === imageUrls.length
                        ? "Não foi possível importar as imagens."
                        : `${failedCount} de ${imageUrls.length} imagens não puderam ser importadas.`,
                );
            }
        } finally {
            importingRef.current = false;
            setIsImporting(false);
        }
    };

    const feedbackVisible = isDraggingFiles || isImporting || Boolean(importError);
    const feedbackMessage = isImporting
        ? importProgress.completed === 0
            ? `Importando ${importProgress.total} ${importProgress.total === 1 ? "imagem" : "imagens"}...`
            : `Importando ${importProgress.completed} de ${importProgress.total}...`
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
