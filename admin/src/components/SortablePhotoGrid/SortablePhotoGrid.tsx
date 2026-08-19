import "./SortablePhotoGrid.css";

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
import { GripVertical } from "lucide-react";

import type { AlbumPhoto } from "../../types/eventAlbum";

interface SortablePhotoGridProps {
    photos: AlbumPhoto[];
    onReorder: (photos: AlbumPhoto[]) => void;
    onRemove: (photoId: string) => void;
}

interface PhotoCardProps {
    photo: AlbumPhoto;
    onRemove: (photoId: string) => void;
}

const PhotoContent = ({ photo, onRemove }: PhotoCardProps) => (
    <>
        <button
            type="button"
            className="album-form__photo-remove"
            onClick={() => onRemove(photo.id)}
            aria-label={`Remover foto ${photo.name}`}
        >
            ×
        </button>

        <img src={photo.preview} alt={photo.name} />
        <span>{photo.name}</span>
    </>
);

const StaticPhotoItem = ({ photo, onRemove }: PhotoCardProps) => (
    <div className="album-form__photo">
        <PhotoContent photo={photo} onRemove={onRemove} />
    </div>
);

const SortablePhotoItem = ({ photo, onRemove }: PhotoCardProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: photo.id });

    return (
        <div
            ref={setNodeRef}
            className={`album-form__photo sortable-photo-grid__item${
                isDragging ? " sortable-photo-grid__item--dragging" : ""
            }`}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
            }}
        >
            <button
                type="button"
                className={`sortable-photo-grid__handle${
                    isDragging ? " sortable-photo-grid__handle--dragging" : ""
                }`}
                aria-label={`Reordenar foto ${photo.name}`}
                {...attributes}
                {...listeners}
            >
                <GripVertical size={18} aria-hidden="true" />
            </button>

            <PhotoContent photo={photo} onRemove={onRemove} />
        </div>
    );
};

const SortablePhotoGrid = ({
    photos,
    onReorder,
    onRemove,
}: SortablePhotoGridProps) => {
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

    const photoIds = photos.map((photo) => photo.id);
    const hasValidIds = photoIds.every(
        (id) => typeof id === "string" && id.trim().length > 0,
    );
    const hasUniqueIds = new Set(photoIds).size === photoIds.length;
    const canReorder = hasValidIds && hasUniqueIds;

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        if (!over || active.id === over.id) return;

        const oldIndex = photos.findIndex(
            (photo) => photo.id === active.id,
        );
        const newIndex = photos.findIndex(
            (photo) => photo.id === over.id,
        );

        if (oldIndex < 0 || newIndex < 0) return;

        onReorder(arrayMove(photos, oldIndex, newIndex));
    };

    if (!canReorder) {
        return (
            <div className="album-form__photos">
                {photos.map((photo, index) => (
                    <StaticPhotoItem
                        key={`${photo.id || "photo-without-id"}-${index}`}
                        photo={photo}
                        onRemove={onRemove}
                    />
                ))}
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={photoIds}
                strategy={rectSortingStrategy}
            >
                <div className="album-form__photos">
                    {photos.map((photo) => (
                        <SortablePhotoItem
                            key={photo.id}
                            photo={photo}
                            onRemove={onRemove}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
};

export default SortablePhotoGrid;
