import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import "./PhotoViewer.css";

export interface PhotoViewerPhoto {
    id: string;
    preview: string;
    name: string;
}

export interface PhotoViewerProps {
    photos: readonly PhotoViewerPhoto[];
    /** Used on mount. Mount a new viewer to start another viewing session. */
    initialIndex?: number;
    onClose: () => void;
}

const CLOSING_DURATION_MS = 300;
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Mount to open; onClose is called once after closing, or when the list is empty. */
const PhotoViewer = ({ photos, initialIndex = 0, onClose }: PhotoViewerProps) => {
    const [selection, setSelection] = useState(() => {
        const index = Math.max(0, Math.min(
            Number.isFinite(initialIndex) ? Math.trunc(initialIndex) : 0,
            photos.length - 1,
        ));
        return { id: photos[index]?.id, index };
    });
    const [closing, setClosing] = useState(false);
    const [closed, setClosed] = useState(false);
    const closingRef = useRef(false);
    const closedRef = useRef(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const onCloseRef = useRef(onClose);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const thumbnailsRef = useRef<HTMLDivElement>(null);
    const activeThumbnailRef = useRef<HTMLButtonElement>(null);

    // Prefer identity; fall back to the nearest valid position if it disappeared.
    const matchingIndex = selection.id
        ? photos.findIndex((photo) => photo.id === selection.id)
        : -1;
    const index = matchingIndex >= 0
        ? matchingIndex
        : Math.max(0, Math.min(selection.index, photos.length - 1));
    const photo = photos[index];
    if (photo && (selection.id !== photo.id || selection.index !== index)) {
        setSelection({ id: photo.id, index });
    }
    const visible = !closed && Boolean(photo);

    useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

    const finishClosing = useCallback(() => {
        if (closedRef.current) return;
        closedRef.current = true;
        if (timerRef.current !== null) clearTimeout(timerRef.current);
        timerRef.current = null;
        setClosed(true);
        onCloseRef.current();
    }, []);

    const close = useCallback(() => {
        if (closingRef.current || closedRef.current) return;
        closingRef.current = true;
        setClosing(true);
        if (reducedMotion()) {
            finishClosing();
        } else {
            timerRef.current = setTimeout(finishClosing, CLOSING_DURATION_MS);
        }
    }, [finishClosing]);

    useEffect(() => {
        if (photos.length === 0) finishClosing();
    }, [photos.length, finishClosing]);

    useEffect(() => () => {
        if (timerRef.current !== null) clearTimeout(timerRef.current);
    }, []);

    useEffect(() => {
        if (!visible) return;
        const previousFocus = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        closeButtonRef.current?.focus({ preventScroll: true });
        return () => {
            document.body.style.overflow = previousOverflow;
            if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
                previousFocus.focus({ preventScroll: true });
            }
        };
    }, [visible]);

    const select = useCallback((nextIndex: number) => {
        if (closingRef.current || closedRef.current || !photos[nextIndex]) return;
        setSelection({ id: photos[nextIndex].id, index: nextIndex });
    }, [photos]);

    useEffect(() => {
        if (!visible) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                close();
            } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault();
                select(index + (event.key === "ArrowLeft" ? -1 : 1));
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [visible, index, close, select]);

    useEffect(() => {
        if (!visible) return;
        const strip = thumbnailsRef.current;
        const thumbnail = activeThumbnailRef.current;
        if (!strip || !thumbnail) return;
        const bounds = strip.getBoundingClientRect();
        const activeBounds = thumbnail.getBoundingClientRect();
        if (activeBounds.left >= bounds.left && activeBounds.right <= bounds.right) return;
        strip.scrollTo({
            left: Math.max(0, strip.scrollLeft + activeBounds.left
                + activeBounds.width / 2 - bounds.left - bounds.width / 2),
            behavior: reducedMotion() ? "auto" : "smooth",
        });
    }, [visible, index, photos]);

    if (!visible) return null;

    return createPortal(
        <div
            className={`photo-viewer${closing ? " photo-viewer--closing" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label={`Visualização ampliada: ${photo.name}`}
            onClick={close}
        >
            <button ref={closeButtonRef} type="button" className="photo-viewer__close"
                aria-label="Fechar visualizador" onClick={(event) => {
                    event.stopPropagation();
                    close();
                }}>
                <X size={24} aria-hidden="true" />
            </button>
            <button type="button" className="photo-viewer__navigation photo-viewer__navigation--previous"
                aria-label="Foto anterior" disabled={closing || index === 0}
                onClick={(event) => { event.stopPropagation(); select(index - 1); }}>
                <ChevronLeft size={28} aria-hidden="true" />
            </button>
            <button type="button" className="photo-viewer__navigation photo-viewer__navigation--next"
                aria-label="Próxima foto" disabled={closing || index === photos.length - 1}
                onClick={(event) => { event.stopPropagation(); select(index + 1); }}>
                <ChevronRight size={28} aria-hidden="true" />
            </button>
            <div className="photo-viewer__layout">
                <div className="photo-viewer__content" onClick={(event) => event.stopPropagation()}>
                    <img src={photo.preview} alt={photo.name} />
                </div>
                <div ref={thumbnailsRef} className="photo-viewer__thumbnails"
                    role="group" aria-label="Fotos" onClick={(event) => event.stopPropagation()}>
                    {photos.map((item, itemIndex) => (
                        <button key={`${item.id}-${itemIndex}`} type="button"
                            ref={itemIndex === index ? activeThumbnailRef : undefined}
                            className={`photo-viewer__thumbnail${itemIndex === index ? " photo-viewer__thumbnail--active" : ""}`}
                            aria-label={`Abrir foto ${itemIndex + 1}: ${item.name}`}
                            aria-current={itemIndex === index ? "true" : undefined}
                            disabled={closing} onClick={() => select(itemIndex)}>
                            <img src={item.preview} alt="" loading="lazy" decoding="async" />
                        </button>
                    ))}
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default PhotoViewer;
