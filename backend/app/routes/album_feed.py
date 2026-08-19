import re
import unicodedata

from fastapi import APIRouter, Depends, HTTPException
from firebase_admin import firestore
from pydantic import BaseModel, ConfigDict, Field

from app.firebase.firestore import db
from app.dependencies.admin_auth import (
    AuthenticatedAdmin,
    get_authenticated_admin,
)


router = APIRouter(
    prefix="/album-feed",
    tags=["Album Feed"],
)

public_router = APIRouter(
    prefix="/public/album-feed",
    tags=["Public Album Feed"],
)

MAX_SLUG_LENGTH = 80
MAX_SLUG_COLLISION_ATTEMPTS = 1000


class CreateAlbumFeedDocumentRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=200)


class UpdateAlbumFeedSlugRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=200)


def normalize_album_feed_slug(name: str) -> str:
    normalized = unicodedata.normalize("NFKD", name.strip().lower())
    ascii_name = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_name)
    slug = re.sub(r"-+", "-", slug).strip("-")
    slug = slug[:MAX_SLUG_LENGTH].rstrip("-")

    if not slug:
        raise HTTPException(
            status_code=422,
            detail="O nome do álbum não gera um slug válido.",
        )

    return slug


def _slug_candidate(base_slug: str, attempt: int) -> str:
    if attempt == 1:
        return base_slug

    suffix = f"-{attempt}"
    available_length = MAX_SLUG_LENGTH - len(suffix)
    truncated_base = base_slug[:available_length].rstrip("-")

    return f"{truncated_base}{suffix}"


def _is_slug_candidate(slug: str, base_slug: str) -> bool:
    return any(
        slug == _slug_candidate(base_slug, attempt)
        for attempt in range(1, MAX_SLUG_COLLISION_ATTEMPTS + 1)
    )


@router.post("", status_code=201)
def create_album_feed_document(data: CreateAlbumFeedDocumentRequest):
    base_slug = normalize_album_feed_slug(data.name)
    album_reference = db.collection("AlbumFeed").document()
    transaction = db.transaction()

    @firestore.transactional
    def reserve_slug(current_transaction):
        for attempt in range(1, MAX_SLUG_COLLISION_ATTEMPTS + 1):
            slug = _slug_candidate(base_slug, attempt)
            slug_reference = db.collection("AlbumFeedSlugs").document(slug)
            slug_document = slug_reference.get(
                transaction=current_transaction,
            )

            if slug_document.exists:
                continue

            current_transaction.set(
                album_reference,
                {
                    "slug": slug,
                    "createdAt": firestore.SERVER_TIMESTAMP,
                    "updatedAt": firestore.SERVER_TIMESTAMP,
                },
            )
            current_transaction.set(
                slug_reference,
                {
                    "albumId": album_reference.id,
                    "createdAt": firestore.SERVER_TIMESTAMP,
                },
            )

            return slug

        raise HTTPException(
            status_code=409,
            detail="Não foi possível gerar um slug único para o álbum.",
        )

    slug = reserve_slug(transaction)

    return {
        "albumId": album_reference.id,
        "slug": slug,
    }


@router.patch("/{album_id}/slug")
def update_album_feed_slug(
    album_id: str,
    data: UpdateAlbumFeedSlugRequest,
):
    name = data.name.strip()
    base_slug = normalize_album_feed_slug(name)
    album_reference = db.collection("AlbumFeed").document(album_id)
    transaction = db.transaction()

    @firestore.transactional
    def update_identity(current_transaction):
        album_document = album_reference.get(
            transaction=current_transaction,
        )

        if not album_document.exists:
            raise HTTPException(
                status_code=404,
                detail="Álbum não encontrado.",
            )

        album_data = album_document.to_dict() or {}
        current_name = album_data.get("name")
        current_slug = album_data.get("slug")
        current_slug_reference = None
        current_slug_document = None

        if isinstance(current_slug, str) and current_slug:
            current_slug_reference = db.collection(
                "AlbumFeedSlugs"
            ).document(current_slug)
            current_slug_document = current_slug_reference.get(
                transaction=current_transaction,
            )

            if (
                current_slug_document.exists
                and current_slug_document.to_dict().get("albumId")
                != album_id
            ):
                raise HTTPException(
                    status_code=409,
                    detail="A reserva atual do slug pertence a outro álbum.",
                )
        else:
            current_slug = None

        current_reservation_belongs_to_album = bool(
            current_slug_document
            and current_slug_document.exists
            and current_slug_document.to_dict().get("albumId") == album_id
        )

        if (
            current_slug
            and current_reservation_belongs_to_album
            and _is_slug_candidate(current_slug, base_slug)
        ):
            selected_slug = current_slug
            selected_slug_reference = current_slug_reference
            selected_slug_document = current_slug_document
        else:
            selected_slug = None
            selected_slug_reference = None
            selected_slug_document = None

            for attempt in range(1, MAX_SLUG_COLLISION_ATTEMPTS + 1):
                candidate = _slug_candidate(base_slug, attempt)
                candidate_reference = db.collection(
                    "AlbumFeedSlugs"
                ).document(candidate)
                candidate_document = candidate_reference.get(
                    transaction=current_transaction,
                )

                if (
                    candidate_document.exists
                    and candidate_document.to_dict().get("albumId")
                    != album_id
                ):
                    continue

                selected_slug = candidate
                selected_slug_reference = candidate_reference
                selected_slug_document = candidate_document
                break

        if selected_slug is None or selected_slug_reference is None:
            raise HTTPException(
                status_code=409,
                detail="Não foi possível gerar um slug único para o álbum.",
            )

        changed = current_name != name or current_slug != selected_slug
        selected_reservation_exists = bool(
            selected_slug_document and selected_slug_document.exists
        )

        if not changed and selected_reservation_exists:
            return {
                "albumId": album_id,
                "name": name,
                "slug": selected_slug,
                "changed": False,
            }

        if not selected_reservation_exists:
            current_transaction.set(
                selected_slug_reference,
                {
                    "albumId": album_id,
                    "createdAt": firestore.SERVER_TIMESTAMP,
                },
            )

        current_transaction.update(
            album_reference,
            {
                "name": name,
                "slug": selected_slug,
                "updatedAt": firestore.SERVER_TIMESTAMP,
            },
        )

        return {
            "albumId": album_id,
            "name": name,
            "slug": selected_slug,
            "changed": changed,
        }

    return update_identity(transaction)


@router.delete("/{album_id}", status_code=204)
def delete_album_feed(album_id: str):
    album_reference = db.collection("AlbumFeed").document(album_id)
    album_document = album_reference.get()

    if not album_document.exists:
        raise HTTPException(status_code=404, detail="Álbum não encontrado.")

    reservations = list(
        db.collection("AlbumFeedSlugs")
        .where("albumId", "==", album_id)
        .stream()
    )
    batch = db.batch()

    for reservation in reservations:
        batch.delete(reservation.reference)

    batch.delete(album_reference)
    batch.commit()


@router.post("/backfill-slugs")
def backfill_album_feed_slugs(
    _authenticated_admin: AuthenticatedAdmin = Depends(
        get_authenticated_admin
    ),
):
    result = {"processed": 0, "created": 0, "unchanged": 0, "errors": []}

    for album_document in db.collection("AlbumFeed").stream():
        album_id = album_document.id
        album_data = album_document.to_dict() or {}
        name = album_data.get("name")

        if not isinstance(name, str):
            result["errors"].append(
                {"albumId": album_id, "detail": "Nome inválido."}
            )
            continue

        result["processed"] += 1
        album_reference = db.collection("AlbumFeed").document(album_id)
        transaction = db.transaction()

        @firestore.transactional
        def backfill(current_transaction):
            base_slug = normalize_album_feed_slug(name)
            current_document = album_reference.get(
                transaction=current_transaction,
            )
            current_data = current_document.to_dict() or {}
            current_slug = current_data.get("slug")

            if isinstance(current_slug, str) and current_slug:
                slug_reference = db.collection("AlbumFeedSlugs").document(
                    current_slug
                )
                slug_document = slug_reference.get(
                    transaction=current_transaction,
                )

                if slug_document.exists:
                    if slug_document.to_dict().get("albumId") != album_id:
                        raise HTTPException(
                            status_code=409,
                            detail="A reserva pertence a outro álbum.",
                        )
                    return False

                current_transaction.set(
                    slug_reference,
                    {
                        "albumId": album_id,
                        "createdAt": firestore.SERVER_TIMESTAMP,
                    },
                )
                return True

            for attempt in range(1, MAX_SLUG_COLLISION_ATTEMPTS + 1):
                slug = _slug_candidate(base_slug, attempt)
                slug_reference = db.collection("AlbumFeedSlugs").document(slug)
                slug_document = slug_reference.get(
                    transaction=current_transaction,
                )

                if slug_document.exists:
                    continue

                current_transaction.set(
                    slug_reference,
                    {
                        "albumId": album_id,
                        "createdAt": firestore.SERVER_TIMESTAMP,
                    },
                )
                current_transaction.update(
                    album_reference,
                    {
                        "slug": slug,
                        "updatedAt": firestore.SERVER_TIMESTAMP,
                    },
                )
                return True

            raise HTTPException(
                status_code=409,
                detail="Não foi possível gerar um slug único para o álbum.",
            )

        try:
            if backfill(transaction):
                result["created"] += 1
            else:
                result["unchanged"] += 1
        except HTTPException as error:
            result["errors"].append(
                {"albumId": album_id, "detail": error.detail}
            )

    return result


PUBLIC_ALBUM_FIELDS = (
    "name",
    "slug",
    "description",
    "category",
    "eventDate",
    "eventTime",
    "eventLocation",
    "coverPhoto",
    "photos",
    "videos",
    "categories",
)

PUBLIC_MEDIA_FIELDS = (
    "id",
    "name",
    "preview",
    "size",
)


def _public_media(item):
    if not isinstance(item, dict):
        return None
    return {
        field: item.get(field)
        for field in PUBLIC_MEDIA_FIELDS
        if field in item
    }


def _public_album_data(album_data: dict, album_id: str):
    public_album = {
        field: album_data.get(field)
        for field in PUBLIC_ALBUM_FIELDS
        if field in album_data
    }
    public_album["id"] = album_id
    public_album["coverPhoto"] = _public_media(album_data.get("coverPhoto"))
    public_album["photos"] = [
        media
        for item in album_data.get("photos", [])
        if (media := _public_media(item)) is not None
    ]
    public_album["videos"] = [
        media
        for item in album_data.get("videos", [])
        if (media := _public_media(item)) is not None
    ]
    public_album["categories"] = [
        {
            "id": category.get("id"),
            "name": category.get("name"),
            "photos": [
                media
                for item in category.get("photos", [])
                if (media := _public_media(item)) is not None
            ],
        }
        for category in album_data.get("categories", [])
        if isinstance(category, dict)
    ]
    return public_album


def _resolve_album_document(identifier: str):
    reservation = db.collection("AlbumFeedSlugs").document(identifier).get()
    resolved_by = "slug"

    if reservation.exists:
        album_id = reservation.to_dict().get("albumId")
        if not isinstance(album_id, str) or not album_id:
            raise HTTPException(status_code=404, detail="Evento não encontrado.")
        album_document = db.collection("AlbumFeed").document(album_id).get()
    else:
        resolved_by = "legacyId"
        album_document = db.collection("AlbumFeed").document(identifier).get()

    if not album_document.exists:
        raise HTTPException(status_code=404, detail="Evento não encontrado.")

    return album_document, resolved_by


def _resolve_category_document(identifier: str, *, allow_legacy_id: bool):
    reservation = db.collection("CategorySlugs").document(identifier).get()
    resolved_by = "slug"

    if reservation.exists:
        category_id = reservation.to_dict().get("categoryId")
        if not isinstance(category_id, str) or not category_id:
            raise HTTPException(status_code=404, detail="Categoria não encontrada.")
        category_document = db.collection("categories").document(category_id).get()
    elif allow_legacy_id:
        resolved_by = "legacyId"
        category_document = db.collection("categories").document(identifier).get()
    else:
        raise HTTPException(status_code=404, detail="Categoria não encontrada.")

    if not category_document.exists:
        raise HTTPException(status_code=404, detail="Categoria não encontrada.")

    return category_document, resolved_by


def _canonical_category_slug(category_document):
    category_data = category_document.to_dict() or {}
    canonical_slug = category_data.get("slug")

    if not isinstance(canonical_slug, str) or not canonical_slug:
        raise HTTPException(status_code=404, detail="Categoria não encontrada.")

    return canonical_slug


@router.get("/resolve/{category_identifier}/{album_identifier}")
def resolve_album_feed_for_admin(
    category_identifier: str,
    album_identifier: str,
    _authenticated_admin: AuthenticatedAdmin = Depends(
        get_authenticated_admin
    ),
):
    category_document, category_resolved_by = _resolve_category_document(
        category_identifier,
        allow_legacy_id=True,
    )
    album_document, album_resolved_by = _resolve_album_document(album_identifier)
    album_data = album_document.to_dict() or {}

    if album_data.get("category") != category_document.id:
        raise HTTPException(status_code=404, detail="Evento não encontrado.")

    canonical_album_slug = album_data.get("slug")
    if not isinstance(canonical_album_slug, str) or not canonical_album_slug:
        raise HTTPException(status_code=422, detail="Evento sem slug válido.")

    canonical_category_slug = _canonical_category_slug(category_document)

    return {
        "categoryId": category_document.id,
        "albumId": album_document.id,
        "canonicalCategorySlug": canonical_category_slug,
        "canonicalAlbumSlug": canonical_album_slug,
        "categoryResolvedBy": category_resolved_by,
        "albumResolvedBy": album_resolved_by,
        "isCanonical": (
            category_identifier == canonical_category_slug
            and album_identifier == canonical_album_slug
        ),
    }


@public_router.get("/{category_identifier}/{album_identifier}")
def get_public_album_feed_by_category(
    category_identifier: str,
    album_identifier: str,
):
    category_document, _ = _resolve_category_document(
        category_identifier,
        allow_legacy_id=False,
    )
    category_data = category_document.to_dict() or {}

    if category_data.get("status") != "active":
        raise HTTPException(status_code=404, detail="Categoria não encontrada.")

    album_document, _ = _resolve_album_document(album_identifier)
    album_data = album_document.to_dict() or {}

    if (
        album_data.get("status") != "published"
        or album_data.get("category") != category_document.id
    ):
        raise HTTPException(status_code=404, detail="Evento não encontrado.")

    canonical_category_slug = _canonical_category_slug(category_document)
    canonical_album_slug = album_data.get("slug")

    if not isinstance(canonical_album_slug, str) or not canonical_album_slug:
        raise HTTPException(status_code=404, detail="Evento não encontrado.")

    return {
        "categoryId": category_document.id,
        "albumId": album_document.id,
        "canonicalCategorySlug": canonical_category_slug,
        "canonicalAlbumSlug": canonical_album_slug,
        "isCanonical": (
            category_identifier == canonical_category_slug
            and album_identifier == canonical_album_slug
        ),
        "album": _public_album_data(album_data, album_document.id),
    }


@public_router.get("/{identifier}")
def get_public_album_feed(identifier: str):
    album_document, resolved_by = _resolve_album_document(identifier)

    album_data = album_document.to_dict() or {}

    if album_data.get("status") != "published":
        raise HTTPException(status_code=404, detail="Evento não encontrado.")

    category_id = album_data.get("category")
    if not isinstance(category_id, str) or not category_id:
        raise HTTPException(status_code=404, detail="Categoria não encontrada.")

    category_document = db.collection("categories").document(category_id).get()
    if not category_document.exists:
        raise HTTPException(status_code=404, detail="Categoria não encontrada.")

    category_data = category_document.to_dict() or {}
    if category_data.get("status") != "active":
        raise HTTPException(status_code=404, detail="Categoria não encontrada.")

    canonical_slug = album_data.get("slug")
    canonical_category_slug = _canonical_category_slug(category_document)
    public_album = _public_album_data(album_data, album_document.id)

    return {
        "albumId": album_document.id,
        "canonicalSlug": canonical_slug,
        "canonicalCategorySlug": canonical_category_slug,
        "requestedIdentifier": identifier,
        "resolvedBy": resolved_by,
        "isCanonical": bool(canonical_slug and identifier == canonical_slug),
        "album": public_album,
    }
