from datetime import datetime, timezone
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from firebase_admin import firestore
from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.dependencies.client_auth import (
    AuthenticatedClient,
    get_authenticated_client,
)
from app.firebase.firestore import db


router = APIRouter(
    prefix="/client/albums",
    tags=["Client Albums"],
)


class CreateClientSelectionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    selectionName: str = Field(min_length=1, max_length=100)
    personName: str = Field(min_length=1, max_length=80)
    email: EmailStr = Field(max_length=254)
    photoIds: list[str] = Field(min_length=1, max_length=1000)


def _text_value(value: Any) -> str:
    if isinstance(value, str):
        return value

    return ""


def _serialize_timestamp(value: Any) -> str | None:
    if not isinstance(value, datetime):
        return None

    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc).isoformat()


def _timestamp_sort_value(value: Any) -> datetime:
    if not isinstance(value, datetime):
        return datetime.min.replace(tzinfo=timezone.utc)

    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc)


def _media_items(value: Any, media_type: str) -> list[dict[str, str]]:
    if not isinstance(value, list):
        return []

    serialized: list[dict[str, str]] = []
    used_ids: set[str] = set()

    for index, item in enumerate(value):
        if not isinstance(item, dict):
            continue

        stored_id = _text_value(item.get("id")).strip()
        media_id = stored_id

        if not media_id or media_id in used_ids:
            media_id = f"legacy-{media_type}-{index}"

            suffix = 2
            while media_id in used_ids:
                media_id = f"legacy-{media_type}-{index}-{suffix}"
                suffix += 1

        used_ids.add(media_id)
        serialized.append({
            "id": media_id,
            "name": _text_value(item.get("name")),
            "preview": _text_value(item.get("preview")),
        })

    return serialized


def _get_owned_album(album_id: str, client_id: str):
    album_document = db.collection("AlbumClient").document(album_id).get()

    if not album_document.exists:
        raise HTTPException(status_code=404, detail="Álbum não encontrado.")

    album = album_document.to_dict() or {}

    if album.get("clientId") != client_id:
        raise HTTPException(status_code=404, detail="Álbum não encontrado.")

    return album_document, album


def _serialize_album_summary(album_id: str, album: dict[str, Any]):
    cover = album.get("coverPhoto")
    cover_preview = ""

    if isinstance(cover, dict):
        cover_preview = _text_value(cover.get("preview"))

    watermarked_photos = album.get("watermarkedPhotos")
    watermarked_videos = album.get("watermarkedVideos")

    if not isinstance(watermarked_photos, list):
        watermarked_photos = []

    if not isinstance(watermarked_videos, list):
        watermarked_videos = []

    if not cover_preview:
        for photo in watermarked_photos:
            if isinstance(photo, dict):
                cover_preview = _text_value(photo.get("preview"))
                if cover_preview:
                    break

    download_days = album.get("highQualityDownloadDays")

    if download_days is not None and (
        isinstance(download_days, bool)
        or not isinstance(download_days, (int, float))
    ):
        download_days = "invalid"

    return {
        "id": album_id,
        "slug": _text_value(album.get("slug")),
        "name": _text_value(album.get("name")),
        "eventDate": _text_value(album.get("eventDate")) or None,
        "eventLocation": _text_value(album.get("eventLocation")) or None,
        "coverPhoto": {"preview": cover_preview} if cover_preview else None,
        "photoCount": len(watermarked_photos),
        "videoCount": len(watermarked_videos),
        "createdAt": _serialize_timestamp(album.get("createdAt")),
        "highQualityDownloadDays": download_days,
    }


def _serialize_album_details(album_id: str, album: dict[str, Any]):
    return {
        "id": album_id,
        "slug": _text_value(album.get("slug")),
        "name": _text_value(album.get("name")),
        "eventDate": _text_value(album.get("eventDate")) or None,
        "eventLocation": _text_value(album.get("eventLocation")) or None,
        "watermarkedPhotos": _media_items(
            album.get("watermarkedPhotos"),
            "photo",
        ),
        "watermarkedVideos": _media_items(
            album.get("watermarkedVideos"),
            "video",
        ),
    }


@router.get("")
def list_client_albums(
    client: Annotated[
        AuthenticatedClient,
        Depends(get_authenticated_client),
    ],
):
    albums: list[tuple[str, dict[str, Any]]] = []
    documents = (
        db.collection("AlbumClient")
        .where("clientId", "==", client.id)
        .stream()
    )

    for document in documents:
        album = document.to_dict()

        if isinstance(album, dict):
            albums.append((document.id, album))

    albums.sort(
        key=lambda item: _timestamp_sort_value(item[1].get("createdAt")),
        reverse=True,
    )

    return {
        "albums": [
            _serialize_album_summary(album_id, album)
            for album_id, album in albums
        ]
    }


@router.get("/resolve/{identifier}")
def resolve_client_album(
    identifier: str,
    client: Annotated[
        AuthenticatedClient,
        Depends(get_authenticated_client),
    ],
):
    reservation_document = (
        db.collection("AlbumClientSlugs").document(identifier).get()
    )
    resolved_by = "slug"

    if reservation_document.exists:
        album_id = (reservation_document.to_dict() or {}).get("albumId")

        if not isinstance(album_id, str) or not album_id:
            raise HTTPException(status_code=404, detail="Álbum não encontrado.")
    else:
        resolved_by = "legacyId"
        album_id = identifier

    album_document, album = _get_owned_album(album_id, client.id)
    canonical_slug = album.get("slug")

    if not isinstance(canonical_slug, str) or not canonical_slug:
        raise HTTPException(status_code=404, detail="Álbum não encontrado.")

    return {
        "albumId": album_document.id,
        "canonicalSlug": canonical_slug,
        "resolvedBy": resolved_by,
        "isCanonical": identifier == canonical_slug,
        "album": _serialize_album_details(album_document.id, album),
    }


@router.get("/{album_id}")
def get_client_album(
    album_id: str,
    client: Annotated[
        AuthenticatedClient,
        Depends(get_authenticated_client),
    ],
):
    album_document, album = _get_owned_album(album_id, client.id)

    return {
        "album": _serialize_album_details(album_document.id, album),
    }


@router.post("/{album_id}/selections", status_code=201)
def create_client_album_selection(
    album_id: str,
    data: CreateClientSelectionRequest,
    client: Annotated[
        AuthenticatedClient,
        Depends(get_authenticated_client),
    ],
):
    _, album = _get_owned_album(album_id, client.id)
    selection_name = data.selectionName.strip()
    person_name = data.personName.strip()
    email = str(data.email).strip().lower()

    if not selection_name:
        raise HTTPException(
            status_code=422,
            detail="O nome da seleção é obrigatório.",
        )

    if not person_name:
        raise HTTPException(
            status_code=422,
            detail="O nome da pessoa é obrigatório.",
        )

    if len(set(data.photoIds)) != len(data.photoIds):
        raise HTTPException(
            status_code=422,
            detail="A seleção possui fotos duplicadas.",
        )

    album_photos = _media_items(album.get("watermarkedPhotos"), "photo")
    photos_by_id = {photo["id"]: photo for photo in album_photos}

    if any(photo_id not in photos_by_id for photo_id in data.photoIds):
        raise HTTPException(
            status_code=422,
            detail="A seleção possui uma foto inválida.",
        )

    selected_photos = [
        {
            "name": photos_by_id[photo_id]["name"],
            "preview": photos_by_id[photo_id]["preview"],
        }
        for photo_id in data.photoIds
    ]

    selection = {
        "clientId": client.id,
        "albumId": album_id,
        "albumName": _text_value(album.get("name")),
        "selectionName": selection_name,
        "personName": person_name,
        "email": email,
        "photos": selected_photos,
        "totalPhotos": len(selected_photos),
        "status": "pending",
        "createdAt": firestore.SERVER_TIMESTAMP,
        "updatedAt": firestore.SERVER_TIMESTAMP,
    }

    selection_reference = (
        db.collection("clients")
        .document(client.id)
        .collection("selections")
        .document()
    )
    selection_reference.set(selection)

    return {
        "id": selection_reference.id,
        "totalPhotos": len(selected_photos),
    }
