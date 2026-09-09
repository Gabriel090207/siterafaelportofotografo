import re
import unicodedata

from fastapi import APIRouter, Depends, HTTPException
from firebase_admin import firestore
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.firebase.firestore import db
from app.dependencies.admin_auth import (
    AuthenticatedAdmin,
    get_authenticated_admin,
)


router = APIRouter(
    prefix="/feed-categories",
    tags=["Feed Categories"],
)

public_router = APIRouter(
    prefix="/public/feed-categories",
    tags=["Public Feed Categories"],
)

MAX_CATEGORY_SLUG_LENGTH = 64
MAX_CATEGORY_SLUG_COLLISION_ATTEMPTS = 1000
RESERVED_ADMIN_CATEGORY_SLUGS = {"novo", "ocultos"}


class CreateFeedCategoryRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=120)
    cover: str = ""
    storagePath: str = ""
    order: int = Field(ge=0)


class UpdateFeedCategorySlugRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=120)


class FeedCategoryBannerImageRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    url: str
    storagePath: str

    @field_validator("id", "url", "storagePath")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        normalized_value = value.strip()

        if not normalized_value:
            raise ValueError("O campo não pode ser vazio.")

        return normalized_value


class UpdateFeedCategoryBannerImagesRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    bannerImages: list[FeedCategoryBannerImageRequest]

    @model_validator(mode="after")
    def validate_unique_banner_images(self):
        image_ids = [image.id for image in self.bannerImages]
        storage_paths = [image.storagePath for image in self.bannerImages]

        if len(set(image_ids)) != len(image_ids):
            raise ValueError("Os IDs das imagens de banner não podem se repetir.")

        if len(set(storage_paths)) != len(storage_paths):
            raise ValueError(
                "Os caminhos das imagens de banner não podem se repetir."
            )

        return self


def _public_banner_images(value):
    if not isinstance(value, list):
        return []

    public_images = []
    image_ids = set()

    for item in value:
        if not isinstance(item, dict):
            return []

        image_id = item.get("id")
        image_url = item.get("url")

        if (
            not isinstance(image_id, str)
            or not image_id.strip()
            or not isinstance(image_url, str)
            or not image_url.strip()
            or image_id.strip() in image_ids
        ):
            return []

        normalized_id = image_id.strip()
        image_ids.add(normalized_id)
        public_images.append(
            {
                "id": normalized_id,
                "url": image_url.strip(),
            }
        )

    return public_images


def normalize_category_slug(name: str) -> str:
    normalized = unicodedata.normalize("NFKD", name.strip().lower())
    ascii_name = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "", ascii_name)
    slug = slug[:MAX_CATEGORY_SLUG_LENGTH]

    if not slug:
        raise HTTPException(
            status_code=422,
            detail="O nome da categoria não gera um slug válido.",
        )

    return slug


def category_slug_candidate(base_slug: str, attempt: int) -> str:
    if attempt == 1:
        return base_slug

    suffix = f"-{attempt}"
    available_length = MAX_CATEGORY_SLUG_LENGTH - len(suffix)
    return f"{base_slug[:available_length]}{suffix}"


def _is_category_slug_candidate(slug: str, base_slug: str) -> bool:
    return any(
        slug == category_slug_candidate(base_slug, attempt)
        for attempt in range(1, MAX_CATEGORY_SLUG_COLLISION_ATTEMPTS + 1)
    )


def _reserve_category_identity(
    current_transaction,
    category_reference,
    category_id: str,
    name: str,
):
    category_document = category_reference.get(
        transaction=current_transaction,
    )

    if not category_document.exists:
        raise HTTPException(
            status_code=404,
            detail="Categoria não encontrada.",
        )

    category_data = category_document.to_dict() or {}
    current_name = category_data.get("name")
    current_slug = category_data.get("slug")
    current_slug_document = None

    if isinstance(current_slug, str) and current_slug:
        current_slug_reference = db.collection("CategorySlugs").document(
            current_slug
        )
        current_slug_document = current_slug_reference.get(
            transaction=current_transaction,
        )

        if (
            current_slug_document.exists
            and current_slug_document.to_dict().get("categoryId")
            != category_id
        ):
            raise HTTPException(
                status_code=409,
                detail="A reserva atual pertence a outra categoria.",
            )

    base_slug = normalize_category_slug(name)
    current_reservation_is_valid = bool(
        current_slug_document
        and current_slug_document.exists
        and current_slug_document.to_dict().get("categoryId") == category_id
    )

    if (
        isinstance(current_slug, str)
        and current_slug
        and current_slug not in RESERVED_ADMIN_CATEGORY_SLUGS
        and current_reservation_is_valid
        and _is_category_slug_candidate(current_slug, base_slug)
    ):
        selected_slug = current_slug
        selected_reference = db.collection("CategorySlugs").document(
            current_slug
        )
        selected_document = current_slug_document
    else:
        selected_slug = None
        selected_reference = None
        selected_document = None

        for attempt in range(1, MAX_CATEGORY_SLUG_COLLISION_ATTEMPTS + 1):
            candidate = category_slug_candidate(base_slug, attempt)
            if candidate in RESERVED_ADMIN_CATEGORY_SLUGS:
                continue
            candidate_reference = db.collection("CategorySlugs").document(
                candidate
            )
            candidate_document = candidate_reference.get(
                transaction=current_transaction,
            )

            if (
                candidate_document.exists
                and candidate_document.to_dict().get("categoryId")
                != category_id
            ):
                continue

            selected_slug = candidate
            selected_reference = candidate_reference
            selected_document = candidate_document
            break

    if selected_slug is None or selected_reference is None:
        raise HTTPException(
            status_code=409,
            detail="Não foi possível gerar um slug único para a categoria.",
        )

    changed = current_name != name or current_slug != selected_slug
    selected_reservation_exists = bool(
        selected_document and selected_document.exists
    )

    if not selected_reservation_exists:
        current_transaction.set(
            selected_reference,
            {
                "categoryId": category_id,
                "createdAt": firestore.SERVER_TIMESTAMP,
            },
        )

    if changed or not selected_reservation_exists:
        current_transaction.update(
            category_reference,
            {
                "name": name,
                "slug": selected_slug,
                "updatedAt": firestore.SERVER_TIMESTAMP,
            },
        )

    return {
        "categoryId": category_id,
        "name": name,
        "slug": selected_slug,
        "changed": changed,
    }


@router.post("", status_code=201)
def create_feed_category(data: CreateFeedCategoryRequest):
    name = data.name.strip()
    base_slug = normalize_category_slug(name)
    category_reference = db.collection("categories").document()
    transaction = db.transaction()

    @firestore.transactional
    def create_category(current_transaction):
        for attempt in range(1, MAX_CATEGORY_SLUG_COLLISION_ATTEMPTS + 1):
            slug = category_slug_candidate(base_slug, attempt)
            if slug in RESERVED_ADMIN_CATEGORY_SLUGS:
                continue
            slug_reference = db.collection("CategorySlugs").document(slug)
            slug_document = slug_reference.get(
                transaction=current_transaction,
            )

            if slug_document.exists:
                continue

            current_transaction.set(
                category_reference,
                {
                    "name": name,
                    "slug": slug,
                    "cover": data.cover,
                    "storagePath": data.storagePath,
                    "order": data.order,
                    "status": "active",
                    "createdAt": firestore.SERVER_TIMESTAMP,
                    "updatedAt": firestore.SERVER_TIMESTAMP,
                },
            )
            current_transaction.set(
                slug_reference,
                {
                    "categoryId": category_reference.id,
                    "createdAt": firestore.SERVER_TIMESTAMP,
                },
            )

            return slug

        raise HTTPException(
            status_code=409,
            detail="Não foi possível gerar um slug único para a categoria.",
        )

    slug = create_category(transaction)

    return {
        "categoryId": category_reference.id,
        "name": name,
        "slug": slug,
    }


@router.patch("/{category_id}/slug")
def update_feed_category_slug(
    category_id: str,
    data: UpdateFeedCategorySlugRequest,
):
    name = data.name.strip()
    category_reference = db.collection("categories").document(category_id)
    transaction = db.transaction()

    @firestore.transactional
    def update_identity(current_transaction):
        return _reserve_category_identity(
            current_transaction,
            category_reference,
            category_id,
            name,
        )

    return update_identity(transaction)


@router.put("/{category_id}/banner-images")
def update_feed_category_banner_images(
    category_id: str,
    data: UpdateFeedCategoryBannerImagesRequest,
    _authenticated_admin: AuthenticatedAdmin = Depends(
        get_authenticated_admin
    ),
):
    category_reference = db.collection("categories").document(category_id)
    category_document = category_reference.get()

    if not category_document.exists:
        raise HTTPException(status_code=404, detail="Categoria não encontrada.")

    expected_storage_prefix = f"Eventos/{category_id}/Banner/"
    banner_images = [image.model_dump() for image in data.bannerImages]

    if any(
        not image["storagePath"].startswith(expected_storage_prefix)
        for image in banner_images
    ):
        raise HTTPException(
            status_code=422,
            detail="Caminho de imagem de banner inválido para esta categoria.",
        )

    category_reference.update(
        {
            "bannerImages": banner_images,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        }
    )

    return {
        "categoryId": category_id,
        "bannerImages": banner_images,
    }


@router.delete("/{category_id}", status_code=204)
def delete_feed_category(category_id: str):
    category_reference = db.collection("categories").document(category_id)
    category_document = category_reference.get()

    if not category_document.exists:
        raise HTTPException(status_code=404, detail="Categoria não encontrada.")

    reservations = list(
        db.collection("CategorySlugs")
        .where("categoryId", "==", category_id)
        .stream()
    )
    batch = db.batch()

    for reservation in reservations:
        batch.delete(reservation.reference)

    batch.delete(category_reference)
    batch.commit()


@router.post("/backfill-slugs")
def backfill_feed_category_slugs(
    _authenticated_admin: AuthenticatedAdmin = Depends(
        get_authenticated_admin
    ),
):
    result = {"processed": 0, "created": 0, "unchanged": 0, "errors": []}

    for category_document in db.collection("categories").stream():
        category_id = category_document.id
        category_data = category_document.to_dict() or {}
        name = category_data.get("name")

        if not isinstance(name, str):
            result["errors"].append(
                {"categoryId": category_id, "detail": "Nome inválido."}
            )
            continue

        result["processed"] += 1
        category_reference = db.collection("categories").document(category_id)
        transaction = db.transaction()

        @firestore.transactional
        def backfill(current_transaction):
            return _reserve_category_identity(
                current_transaction,
                category_reference,
                category_id,
                name.strip(),
            )

        try:
            identity = backfill(transaction)
            if identity["changed"] or not category_data.get("slug"):
                result["created"] += 1
            else:
                result["unchanged"] += 1
        except HTTPException as error:
            result["errors"].append(
                {"categoryId": category_id, "detail": error.detail}
            )

    return result


@router.get("/resolve/{identifier}")
def resolve_feed_category_for_admin(
    identifier: str,
    _authenticated_admin: AuthenticatedAdmin = Depends(
        get_authenticated_admin
    ),
):
    reservation = db.collection("CategorySlugs").document(identifier).get()
    resolved_by = "slug"

    if reservation.exists:
        category_id = reservation.to_dict().get("categoryId")
        if not isinstance(category_id, str) or not category_id:
            raise HTTPException(status_code=404, detail="Categoria não encontrada.")
        category_document = db.collection("categories").document(category_id).get()
    else:
        resolved_by = "legacyId"
        category_document = db.collection("categories").document(identifier).get()

    if not category_document.exists:
        raise HTTPException(status_code=404, detail="Categoria não encontrada.")

    category_data = category_document.to_dict() or {}
    canonical_slug = category_data.get("slug")

    if not isinstance(canonical_slug, str) or not canonical_slug:
        raise HTTPException(status_code=422, detail="Categoria sem slug válido.")

    return {
        "categoryId": category_document.id,
        "canonicalSlug": canonical_slug,
        "requestedIdentifier": identifier,
        "resolvedBy": resolved_by,
        "isCanonical": identifier == canonical_slug,
    }


@public_router.get("/{slug}")
def get_public_feed_category(slug: str):
    reservation = db.collection("CategorySlugs").document(slug).get()

    if not reservation.exists:
        raise HTTPException(status_code=404, detail="Categoria não encontrada.")

    category_id = reservation.to_dict().get("categoryId")

    if not isinstance(category_id, str) or not category_id:
        raise HTTPException(status_code=404, detail="Categoria não encontrada.")

    category_document = db.collection("categories").document(category_id).get()

    if not category_document.exists:
        raise HTTPException(status_code=404, detail="Categoria não encontrada.")

    category_data = category_document.to_dict() or {}

    if category_data.get("status") != "active":
        raise HTTPException(status_code=404, detail="Categoria não encontrada.")

    return {
        "categoryId": category_id,
        "name": category_data.get("name"),
        "canonicalSlug": category_data.get("slug"),
        "requestedSlug": slug,
        "isCanonical": category_data.get("slug") == slug,
        "bannerImages": _public_banner_images(
            category_data.get("bannerImages")
        ),
    }
