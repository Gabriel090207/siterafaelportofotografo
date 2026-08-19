import re
import unicodedata
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from firebase_admin import firestore
from pydantic import BaseModel, ConfigDict, Field

from app.dependencies.admin_auth import (
    AuthenticatedAdmin,
    get_authenticated_admin,
)
from app.firebase.firestore import db


router = APIRouter(
    prefix="/album-client",
    tags=["Album Client"],
)

MAX_SLUG_LENGTH = 80
MAX_SLUG_COLLISION_ATTEMPTS = 1000
RESERVED_ADMIN_SLUGS = {"novo"}


class CreateAlbumClientRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=200)


class UpdateAlbumClientIdentityRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=200)


def normalize_album_client_slug(name: str) -> str:
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
    return (
        slug not in RESERVED_ADMIN_SLUGS
        and any(
            slug == _slug_candidate(base_slug, attempt)
            for attempt in range(1, MAX_SLUG_COLLISION_ATTEMPTS + 1)
        )
    )


def _reservation_reference(slug: str):
    return db.collection("AlbumClientSlugs").document(slug)


def _resolve_album_document(identifier: str):
    reservation = _reservation_reference(identifier).get()
    resolved_by = "slug"

    if reservation.exists:
        album_id = (reservation.to_dict() or {}).get("albumId")
        if not isinstance(album_id, str) or not album_id:
            raise HTTPException(status_code=404, detail="Álbum não encontrado.")
        album_document = db.collection("AlbumClient").document(album_id).get()
    else:
        resolved_by = "legacyId"
        album_document = db.collection("AlbumClient").document(identifier).get()

    if not album_document.exists:
        raise HTTPException(status_code=404, detail="Álbum não encontrado.")

    return album_document, resolved_by


@router.post("", status_code=201)
def create_album_client_document(
    data: CreateAlbumClientRequest,
    _authenticated_admin: Annotated[
        AuthenticatedAdmin,
        Depends(get_authenticated_admin),
    ],
):
    name = data.name.strip()
    base_slug = normalize_album_client_slug(name)
    album_reference = db.collection("AlbumClient").document()
    transaction = db.transaction()

    @firestore.transactional
    def create_album(current_transaction):
        candidate_documents: list[tuple[str, Any, Any]] = []

        for attempt in range(1, MAX_SLUG_COLLISION_ATTEMPTS + 1):
            slug = _slug_candidate(base_slug, attempt)
            if slug in RESERVED_ADMIN_SLUGS:
                continue

            slug_reference = _reservation_reference(slug)
            slug_document = slug_reference.get(transaction=current_transaction)
            candidate_documents.append((slug, slug_reference, slug_document))

            if not slug_document.exists:
                break
        else:
            raise HTTPException(
                status_code=409,
                detail="Não foi possível gerar um slug único para o álbum.",
            )

        slug, slug_reference, _ = candidate_documents[-1]
        current_transaction.set(
            album_reference,
            {
                "name": name,
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

    slug = create_album(transaction)

    return {
        "albumId": album_reference.id,
        "slug": slug,
    }


@router.patch("/{album_id}/identity")
def update_album_client_identity(
    album_id: str,
    data: UpdateAlbumClientIdentityRequest,
    _authenticated_admin: Annotated[
        AuthenticatedAdmin,
        Depends(get_authenticated_admin),
    ],
):
    name = data.name.strip()
    base_slug = normalize_album_client_slug(name)
    album_reference = db.collection("AlbumClient").document(album_id)
    transaction = db.transaction()

    @firestore.transactional
    def update_identity(current_transaction):
        album_document = album_reference.get(transaction=current_transaction)

        if not album_document.exists:
            raise HTTPException(status_code=404, detail="Álbum não encontrado.")

        album = album_document.to_dict() or {}
        current_name = album.get("name")
        current_slug = album.get("slug")
        current_slug_document = None

        if isinstance(current_slug, str) and current_slug:
            current_slug_document = _reservation_reference(current_slug).get(
                transaction=current_transaction,
            )

            if (
                current_slug_document.exists
                and (current_slug_document.to_dict() or {}).get("albumId")
                != album_id
            ):
                raise HTTPException(
                    status_code=409,
                    detail="A reserva atual pertence a outro álbum.",
                )
        else:
            current_slug = None

        current_reservation_is_valid = bool(
            current_slug_document
            and current_slug_document.exists
            and (current_slug_document.to_dict() or {}).get("albumId")
            == album_id
        )

        candidate_documents: list[tuple[str, Any, Any]] = []

        if (
            current_slug
            and current_reservation_is_valid
            and _is_slug_candidate(current_slug, base_slug)
        ):
            selected_slug = current_slug
            selected_reference = _reservation_reference(current_slug)
            selected_document = current_slug_document
        else:
            for attempt in range(1, MAX_SLUG_COLLISION_ATTEMPTS + 1):
                candidate = _slug_candidate(base_slug, attempt)
                if candidate in RESERVED_ADMIN_SLUGS:
                    continue

                candidate_reference = _reservation_reference(candidate)
                candidate_document = candidate_reference.get(
                    transaction=current_transaction,
                )
                candidate_documents.append(
                    (candidate, candidate_reference, candidate_document)
                )

                if (
                    not candidate_document.exists
                    or (candidate_document.to_dict() or {}).get("albumId")
                    == album_id
                ):
                    break
            else:
                raise HTTPException(
                    status_code=409,
                    detail="Não foi possível gerar um slug único para o álbum.",
                )

            selected_slug, selected_reference, selected_document = (
                candidate_documents[-1]
            )

        changed = current_name != name or current_slug != selected_slug
        reservation_exists = bool(selected_document and selected_document.exists)

        if not reservation_exists:
            current_transaction.set(
                selected_reference,
                {
                    "albumId": album_id,
                    "createdAt": firestore.SERVER_TIMESTAMP,
                },
            )

        if changed or not reservation_exists:
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


@router.get("/resolve/{identifier}")
def resolve_album_client_for_admin(
    identifier: str,
    _authenticated_admin: Annotated[
        AuthenticatedAdmin,
        Depends(get_authenticated_admin),
    ],
):
    album_document, resolved_by = _resolve_album_document(identifier)
    album = album_document.to_dict() or {}
    canonical_slug = album.get("slug")

    if not isinstance(canonical_slug, str) or not canonical_slug:
        raise HTTPException(status_code=422, detail="Álbum sem slug válido.")

    return {
        "albumId": album_document.id,
        "canonicalSlug": canonical_slug,
        "resolvedBy": resolved_by,
        "isCanonical": identifier == canonical_slug,
    }


@router.delete("/{album_id}", status_code=204)
def delete_album_client(
    album_id: str,
    _authenticated_admin: Annotated[
        AuthenticatedAdmin,
        Depends(get_authenticated_admin),
    ],
):
    album_reference = db.collection("AlbumClient").document(album_id)
    album_document = album_reference.get()

    if not album_document.exists:
        raise HTTPException(status_code=404, detail="Álbum não encontrado.")

    reservations = list(
        db.collection("AlbumClientSlugs")
        .where("albumId", "==", album_id)
        .stream()
    )
    batch = db.batch()

    for reservation in reservations:
        batch.delete(reservation.reference)

    batch.delete(album_reference)
    batch.commit()


@router.post("/backfill-slugs")
def backfill_album_client_slugs(
    _authenticated_admin: Annotated[
        AuthenticatedAdmin,
        Depends(get_authenticated_admin),
    ],
):
    result: dict[str, Any] = {
        "processed": 0,
        "created": 0,
        "unchanged": 0,
        "errors": [],
    }

    for album_document in db.collection("AlbumClient").stream():
        album_id = album_document.id
        album = album_document.to_dict() or {}
        name = album.get("name")

        if not isinstance(name, str) or not name.strip():
            result["errors"].append(
                {"albumId": album_id, "detail": "Nome inválido."}
            )
            continue

        result["processed"] += 1
        album_reference = db.collection("AlbumClient").document(album_id)
        transaction = db.transaction()

        @firestore.transactional
        def backfill(current_transaction):
            current_document = album_reference.get(
                transaction=current_transaction,
            )
            current_data = current_document.to_dict() or {}
            current_slug = current_data.get("slug")

            if (
                isinstance(current_slug, str)
                and current_slug
                and current_slug not in RESERVED_ADMIN_SLUGS
            ):
                slug_reference = _reservation_reference(current_slug)
                slug_document = slug_reference.get(
                    transaction=current_transaction,
                )

                if slug_document.exists:
                    if (slug_document.to_dict() or {}).get("albumId") != album_id:
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

            if isinstance(current_slug, str) and current_slug:
                current_slug_document = _reservation_reference(current_slug).get(
                    transaction=current_transaction,
                )
                if (
                    current_slug_document.exists
                    and (current_slug_document.to_dict() or {}).get("albumId")
                    != album_id
                ):
                    raise HTTPException(
                        status_code=409,
                        detail="A reserva pertence a outro álbum.",
                    )

            base_slug = normalize_album_client_slug(name)
            candidate_documents: list[tuple[str, Any, Any]] = []

            for attempt in range(1, MAX_SLUG_COLLISION_ATTEMPTS + 1):
                slug = _slug_candidate(base_slug, attempt)
                if slug in RESERVED_ADMIN_SLUGS:
                    continue

                slug_reference = _reservation_reference(slug)
                slug_document = slug_reference.get(
                    transaction=current_transaction,
                )
                candidate_documents.append((slug, slug_reference, slug_document))

                if not slug_document.exists:
                    break
            else:
                raise HTTPException(
                    status_code=409,
                    detail="Não foi possível gerar um slug único para o álbum.",
                )

            slug, slug_reference, _ = candidate_documents[-1]
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


def audit_album_client_slugs() -> dict[str, Any]:
    albums = {
        document.id: document.to_dict() or {}
        for document in db.collection("AlbumClient").stream()
    }
    reservations = {
        document.id: document.to_dict() or {}
        for document in db.collection("AlbumClientSlugs").stream()
    }
    issues: list[dict[str, str]] = []
    missing_slugs: list[str] = []
    predicted: dict[str, str] = {}
    occupied = set(reservations)

    for slug, reservation in reservations.items():
        album_id = reservation.get("albumId")
        if not isinstance(album_id, str) or album_id not in albums:
            issues.append({"slug": slug, "detail": "Reserva sem álbum válido."})

    for album_id, album in albums.items():
        name = album.get("name")
        slug = album.get("slug")

        if not isinstance(name, str) or not name.strip():
            issues.append({"albumId": album_id, "detail": "Nome inválido."})
            continue

        if isinstance(slug, str) and slug:
            if slug in RESERVED_ADMIN_SLUGS:
                issues.append(
                    {"albumId": album_id, "detail": "Slug reservado pelo Admin."}
                )
                continue

            reservation = reservations.get(slug)
            if reservation is None:
                issues.append({"albumId": album_id, "detail": "Slug sem reserva."})
            elif reservation.get("albumId") != album_id:
                issues.append(
                    {"albumId": album_id, "detail": "Reserva pertence a outro álbum."}
                )
            continue

        missing_slugs.append(album_id)
        try:
            base_slug = normalize_album_client_slug(name)
        except HTTPException:
            issues.append(
                {"albumId": album_id, "detail": "Nome não gera slug válido."}
            )
            continue

        for attempt in range(1, MAX_SLUG_COLLISION_ATTEMPTS + 1):
            candidate = _slug_candidate(base_slug, attempt)
            if candidate in RESERVED_ADMIN_SLUGS or candidate in occupied:
                continue
            occupied.add(candidate)
            predicted[album_id] = candidate
            break

    return {
        "albums": len(albums),
        "reservations": len(reservations),
        "missingSlugs": missing_slugs,
        "predictedReservations": predicted,
        "issues": issues,
    }
