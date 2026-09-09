import "./CategoryBannerModal.css";

import {
    useEffect,
    useRef,
    useState,
} from "react";
import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    rectSortingStrategy,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    GripVertical,
    ImagePlus,
    Loader2,
    Trash2,
    Upload,
    X,
} from "lucide-react";

import {
    updateCategoryBannerImages,
} from "../../services/firebase/eventCategory";
import {
    deleteFile,
    uploadCategoryBannerImage,
    validateCategoryBannerImageFile,
} from "../../services/firebase/storageService";
import { useToast } from "../../contexts/ToastContext";

import type {
    CategoryBannerImage,
} from "../../types/eventCategory";

interface PendingBannerImage {
    id: string;
    file: File;
    preview: string;
}

type BannerItem =
    | {
        key: string;
        kind: "persisted";
        image: CategoryBannerImage;
    }
    | {
        key: string;
        kind: "pending";
        image: PendingBannerImage;
    };

interface CategoryBannerModalProps {
    open: boolean;
    categoryId: string;
    categoryName: string;
    initialImages: CategoryBannerImage[];
    onClose: () => void;
    onSaved: (images: CategoryBannerImage[]) => void;
}

interface SortableBannerItemProps {
    item: BannerItem;
    index: number;
    categoryName: string;
    saving: boolean;
    onRemove: (item: BannerItem) => void;
}

const SortableBannerItem = ({
    item,
    index,
    categoryName,
    saving,
    onRemove,
}: SortableBannerItemProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.key, disabled: saving });
    const imageUrl = item.kind === "persisted"
        ? item.image.url
        : item.image.preview;

    return (
        <article
            ref={setNodeRef}
            className={`category-banner-modal__image${
                item.kind === "pending"
                    ? " category-banner-modal__image--pending"
                    : ""
            }${
                isDragging
                    ? " category-banner-modal__image--dragging"
                    : ""
            }`}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
            }}
        >
            <img
                src={imageUrl}
                alt={`Banner ${index + 1} de ${categoryName}`}
            />

            <button
                type="button"
                className={`category-banner-modal__handle${
                    isDragging
                        ? " category-banner-modal__handle--dragging"
                        : ""
                }`}
                disabled={saving}
                aria-label="Reordenar imagem do banner"
                {...attributes}
                {...listeners}
            >
                <GripVertical size={18} aria-hidden="true" />
            </button>

            {item.kind === "pending" && <span>Nova</span>}

            <button
                type="button"
                className="category-banner-modal__remove"
                onClick={() => onRemove(item)}
                disabled={saving}
                aria-label={`Remover banner ${index + 1}`}
            >
                <Trash2 size={17} aria-hidden="true" />
            </button>
        </article>
    );
};

const CategoryBannerModal = ({
    open,
    categoryId,
    categoryName,
    initialImages,
    onClose,
    onSaved,
}: CategoryBannerModalProps) => {
    const { showToast } = useToast();
    const inputRef = useRef<HTMLInputElement>(null);
    const previewUrlsRef = useRef(new Set<string>());

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 7,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const [items, setItems] = useState<BannerItem[]>([]);
    const [removedImages, setRemovedImages] =
        useState<CategoryBannerImage[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) return;

        const previewUrls = previewUrlsRef.current;

        setItems(initialImages.map((image) => ({
            key: `persisted:${image.id}`,
            kind: "persisted" as const,
            image,
        })));
        setRemovedImages([]);
        setSaving(false);
        setError("");

        return () => {
            previewUrls.forEach((url) => URL.revokeObjectURL(url));
            previewUrls.clear();
        };
    }, [initialImages, open]);

    useEffect(() => {
        const previewUrls = previewUrlsRef.current;

        return () => {
            previewUrls.forEach((url) => URL.revokeObjectURL(url));
            previewUrls.clear();
        };
    }, []);

    useEffect(() => {
        if (!open) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !saving) onClose();
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [onClose, open, saving]);

    const handleFiles = (files: File[]) => {
        if (saving || files.length === 0) return;

        try {
            files.forEach(validateCategoryBannerImageFile);
        } catch (fileError) {
            setError(
                fileError instanceof Error
                    ? fileError.message
                    : "Não foi possível adicionar a imagem."
            );
            return;
        }

        const newImages = files.map((file) => {
            const preview = URL.createObjectURL(file);
            previewUrlsRef.current.add(preview);

            return {
                id: crypto.randomUUID(),
                file,
                preview,
            };
        });

        setItems((current) => [
            ...current,
            ...newImages.map((image) => ({
                key: `pending:${image.id}`,
                kind: "pending" as const,
                image,
            })),
        ]);
        setError("");
    };

    const removeItem = (item: BannerItem) => {
        if (saving) return;

        setItems((current) =>
            current.filter((currentItem) => currentItem.key !== item.key)
        );

        if (item.kind === "persisted") {
            setRemovedImages((current) => [...current, item.image]);
        } else {
            URL.revokeObjectURL(item.image.preview);
            previewUrlsRef.current.delete(item.image.preview);
        }

        setError("");
    };

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        if (saving || !over || active.id === over.id) return;

        setItems((current) => {
            const oldIndex = current.findIndex(
                (item) => item.key === active.id,
            );
            const newIndex = current.findIndex(
                (item) => item.key === over.id,
            );

            if (oldIndex < 0 || newIndex < 0) return current;

            return arrayMove(current, oldIndex, newIndex);
        });
    };

    const rollbackUploads = async (images: CategoryBannerImage[]) => {
        await Promise.allSettled(
            images.map((image) => deleteFile(image.storagePath))
        );
    };

    const handleSave = async () => {
        if (saving) return;

        setSaving(true);
        setError("");

        const uploadedImages: CategoryBannerImage[] = [];
        const uploadsByItemKey = new Map<string, CategoryBannerImage>();
        let configurationPersisted = false;

        try {
            for (const item of items) {
                if (item.kind !== "pending") continue;

                const upload = await uploadCategoryBannerImage(
                    categoryId,
                    item.image.file,
                );
                uploadedImages.push(upload);
                uploadsByItemKey.set(item.key, upload);
            }

            const finalImages = items.map((item) => {
                if (item.kind === "persisted") return item.image;

                const uploadedImage = uploadsByItemKey.get(item.key);

                if (!uploadedImage) {
                    throw new Error(
                        "Não foi possível associar uma imagem enviada à ordem do banner."
                    );
                }

                return uploadedImage;
            });

            await updateCategoryBannerImages(categoryId, finalImages);
            configurationPersisted = true;

            onSaved(finalImages);

            const cleanupResults = await Promise.allSettled(
                removedImages.map((image) => deleteFile(image.storagePath))
            );
            const cleanupFailed = cleanupResults.some(
                (result) => result.status === "rejected"
            );

            if (cleanupFailed) {
                showToast(
                    "Banner salvo, mas alguns arquivos antigos não puderam ser removidos.",
                    "warning",
                );
            } else {
                showToast("Banner salvo com sucesso!", "success");
            }

            onClose();
        } catch (saveError) {
            if (!configurationPersisted && uploadedImages.length > 0) {
                await rollbackUploads(uploadedImages);
            }

            const message = saveError instanceof Error
                ? saveError.message
                : "Não foi possível salvar o banner.";
            setError(message);
            showToast(message, "error");
        } finally {
            setSaving(false);
        }
    };

    if (!open) return null;

    const totalImages = items.length;

    return (
        <div
            className="category-banner-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-banner-modal-title"
        >
            <button
                type="button"
                className="category-banner-modal__backdrop"
                onClick={onClose}
                disabled={saving}
                aria-label="Fechar edição do banner"
            />

            <div className="category-banner-modal__card" aria-busy={saving}>
                <button
                    type="button"
                    className="category-banner-modal__close"
                    onClick={onClose}
                    disabled={saving}
                    aria-label="Fechar edição do banner"
                >
                    <X size={20} aria-hidden="true" />
                </button>

                <header className="category-banner-modal__header">
                    <div className="category-banner-modal__icon">
                        <ImagePlus size={28} aria-hidden="true" />
                    </div>
                    <div>
                        <h2 id="category-banner-modal-title">
                            Banner da categoria
                        </h2>
                        <p>{categoryName}</p>
                    </div>
                </header>

                <div className="category-banner-modal__body">
                    <div className="category-banner-modal__summary">
                        <div>
                            <strong>Imagens do banner</strong>
                            <span>{totalImages} imagens</span>
                        </div>

                        <button
                            type="button"
                            className="category-banner-modal__upload"
                            onClick={() => inputRef.current?.click()}
                            disabled={saving}
                        >
                            <Upload size={18} aria-hidden="true" />
                            Adicionar imagens
                        </button>

                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            hidden
                            aria-label="Selecionar imagens para o banner"
                            onChange={(event) => {
                                handleFiles(Array.from(event.target.files ?? []));
                                event.currentTarget.value = "";
                            }}
                        />
                    </div>

                    {error && (
                        <p className="category-banner-modal__error" role="alert">
                            {error}
                        </p>
                    )}

                    {totalImages === 0 ? (
                        <div className="category-banner-modal__empty">
                            <ImagePlus size={32} aria-hidden="true" />
                            <p>Nenhuma imagem configurada para esta categoria.</p>
                        </div>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={items.map((item) => item.key)}
                                strategy={rectSortingStrategy}
                            >
                                <div className="category-banner-modal__grid">
                                    {items.map((item, index) => (
                                        <SortableBannerItem
                                            key={item.key}
                                            item={item}
                                            index={index}
                                            categoryName={categoryName}
                                            saving={saving}
                                            onRemove={removeItem}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    )}
                </div>

                <footer className="category-banner-modal__actions">
                    <button
                        type="button"
                        className="category-banner-modal__cancel"
                        onClick={onClose}
                        disabled={saving}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="category-banner-modal__save"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving && (
                            <Loader2
                                className="category-banner-modal__loader"
                                size={18}
                                aria-hidden="true"
                            />
                        )}
                        {saving ? "Salvando..." : "Salvar banner"}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default CategoryBannerModal;
