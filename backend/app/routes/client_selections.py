from datetime import datetime, timezone
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException

from app.dependencies.client_auth import (
    AuthenticatedClient,
    get_authenticated_client,
)
from app.firebase.firestore import db


router = APIRouter(
    prefix="/client/selections",
    tags=["Client Selections"],
)


def serialize_timestamp(value: Any) -> str | None:
    if isinstance(value, datetime):
        return value.isoformat()

    return None


def text_value(value: Any, default: str = "") -> str:
    if isinstance(value, str):
        return value

    return default


def selection_photos(value: Any) -> list[dict[str, str]]:
    if not isinstance(value, list):
        return []

    photos: list[dict[str, str]] = []

    for photo in value:
        if not isinstance(photo, dict):
            continue

        photos.append({
            "name": text_value(photo.get("name")),
            "preview": text_value(photo.get("preview")),
        })

    return photos


def selection_total_photos(value: Any, photos: list[dict[str, str]]) -> int:
    if isinstance(value, int) and not isinstance(value, bool) and value >= 0:
        return value

    return len(photos)


def selection_preview(value: Any) -> str | None:
    if not isinstance(value, list) or not value:
        return None

    first_photo = value[0]

    if not isinstance(first_photo, dict):
        return None

    preview = first_photo.get("preview")

    if not isinstance(preview, str) or not preview.strip():
        return None

    return preview


def selection_sort_key(item: tuple[str, dict[str, Any]]) -> datetime:
    created_at = item[1].get("createdAt")

    if isinstance(created_at, datetime):
        if created_at.tzinfo is None:
            return created_at.replace(tzinfo=timezone.utc)

        return created_at.astimezone(timezone.utc)

    return datetime.min.replace(tzinfo=timezone.utc)


def serialize_selection_summary(
    selection_id: str,
    selection: dict[str, Any],
) -> dict[str, Any]:
    raw_photos = selection.get("photos")
    photos = selection_photos(raw_photos)

    return {
        "id": selection_id,
        "albumId": text_value(selection.get("albumId")),
        "albumName": text_value(selection.get("albumName")),
        "selectionName": text_value(selection.get("selectionName")),
        "personName": text_value(selection.get("personName")),
        "email": text_value(selection.get("email")),
        "totalPhotos": selection_total_photos(
            selection.get("totalPhotos"),
            photos,
        ),
        "status": text_value(selection.get("status"), "pending"),
        "createdAt": serialize_timestamp(selection.get("createdAt")),
        "preview": selection_preview(raw_photos),
    }


def serialize_selection_details(
    selection_id: str,
    selection: dict[str, Any],
) -> dict[str, Any]:
    photos = selection_photos(selection.get("photos"))

    return {
        "id": selection_id,
        "albumId": text_value(selection.get("albumId")),
        "albumName": text_value(selection.get("albumName")),
        "selectionName": text_value(selection.get("selectionName")),
        "personName": text_value(selection.get("personName")),
        "email": text_value(selection.get("email")),
        "totalPhotos": selection_total_photos(
            selection.get("totalPhotos"),
            photos,
        ),
        "status": text_value(selection.get("status"), "pending"),
        "createdAt": serialize_timestamp(selection.get("createdAt")),
        "photos": photos,
    }


@router.get("")
def list_client_selections(
    authenticated_client: Annotated[
        AuthenticatedClient,
        Depends(get_authenticated_client),
    ],
):
    selections: list[tuple[str, dict[str, Any]]] = []

    selection_documents = (
        db.collection("clients")
        .document(authenticated_client.id)
        .collection("selections")
        .stream()
    )

    for document in selection_documents:
        selection = document.to_dict()

        if not isinstance(selection, dict):
            selection = {}

        selections.append((document.id, selection))

    selections.sort(key=selection_sort_key, reverse=True)

    return {
        "selections": [
            serialize_selection_summary(
                selection_id,
                selection,
            )
            for selection_id, selection in selections
        ]
    }


@router.get("/{selection_id}")
def get_client_selection(
    selection_id: str,
    authenticated_client: Annotated[
        AuthenticatedClient,
        Depends(get_authenticated_client),
    ],
):
    selection_document = (
        db.collection("clients")
        .document(authenticated_client.id)
        .collection("selections")
        .document(selection_id)
        .get()
    )

    if not selection_document.exists:
        raise HTTPException(
            status_code=404,
            detail="Seleção não encontrada.",
        )

    selection = selection_document.to_dict()

    if not isinstance(selection, dict):
        selection = {}

    return {
        "selection": serialize_selection_details(
            selection_document.id,
            selection,
        )
    }
