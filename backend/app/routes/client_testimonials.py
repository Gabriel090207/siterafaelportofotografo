from datetime import datetime, timezone
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Response
from firebase_admin import firestore, storage
from pydantic import BaseModel, ConfigDict, Field

from app.dependencies.client_auth import (
    AuthenticatedClient,
    get_authenticated_client,
)
from app.firebase.firestore import db


router = APIRouter(
    prefix="/client/testimonials",
    tags=["Client Testimonials"],
)


class UpdateClientTestimonialRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=80)
    message: str = Field(min_length=1, max_length=1000)


def normalize_email(value: Any) -> str:
    if not isinstance(value, str):
        return ""

    return value.strip().lower()


def authenticated_email(client: AuthenticatedClient) -> str:
    email = normalize_email(client.email)

    if not email:
        raise HTTPException(
            status_code=401,
            detail="A identidade autenticada não possui um e-mail válido.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return email


def serialize_timestamp(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()

    return value


def serialize_testimonial(
    testimonial_id: str,
    testimonial: dict[str, Any],
) -> dict[str, Any]:
    return {
        "id": testimonial_id,
        "name": testimonial.get("name", ""),
        "email": testimonial.get("email", ""),
        "message": testimonial.get("message", ""),
        "photoUrl": testimonial.get("photoUrl", ""),
        "photoStoragePath": testimonial.get("photoStoragePath", ""),
        "status": testimonial.get("status", "hidden"),
        "createdAt": serialize_timestamp(testimonial.get("createdAt")),
        "updatedAt": serialize_timestamp(testimonial.get("updatedAt")),
    }


def get_owned_testimonial(
    testimonial_id: str,
    authenticated_email: str,
):
    testimonial_ref = (
        db.collection("testimonials")
        .document(testimonial_id)
    )
    testimonial_doc = testimonial_ref.get()

    if not testimonial_doc.exists:
        raise HTTPException(
            status_code=404,
            detail="Depoimento não encontrado.",
        )

    testimonial = testimonial_doc.to_dict() or {}

    if normalize_email(testimonial.get("email")) != authenticated_email:
        raise HTTPException(
            status_code=404,
            detail="Depoimento não encontrado.",
        )

    return testimonial_ref, testimonial


def testimonial_sort_key(item: tuple[str, dict[str, Any]]) -> datetime:
    created_at = item[1].get("createdAt")

    if isinstance(created_at, datetime):
        if created_at.tzinfo is None:
            return created_at.replace(tzinfo=timezone.utc)

        return created_at.astimezone(timezone.utc)

    return datetime.min.replace(tzinfo=timezone.utc)


@router.get("")
def list_client_testimonials(
    authenticated_client: Annotated[
        AuthenticatedClient,
        Depends(get_authenticated_client),
    ],
):
    email = authenticated_email(authenticated_client)
    testimonials: list[tuple[str, dict[str, Any]]] = []

    for document in db.collection("testimonials").stream():
        testimonial = document.to_dict() or {}

        if normalize_email(testimonial.get("email")) == email:
            testimonials.append((document.id, testimonial))

    testimonials.sort(key=testimonial_sort_key, reverse=True)

    return {
        "testimonials": [
            serialize_testimonial(testimonial_id, testimonial)
            for testimonial_id, testimonial in testimonials
        ]
    }


@router.patch("/{testimonial_id}")
def update_client_testimonial(
    testimonial_id: str,
    data: UpdateClientTestimonialRequest,
    authenticated_client: Annotated[
        AuthenticatedClient,
        Depends(get_authenticated_client),
    ],
):
    email = authenticated_email(authenticated_client)
    name = data.name.strip()
    message = data.message.strip()

    if not name:
        raise HTTPException(
            status_code=422,
            detail="O nome é obrigatório.",
        )

    if not message:
        raise HTTPException(
            status_code=422,
            detail="O depoimento é obrigatório.",
        )

    testimonial_ref, _ = get_owned_testimonial(
        testimonial_id,
        email,
    )

    testimonial_ref.update({
        "name": name,
        "message": message,
        "updatedAt": firestore.SERVER_TIMESTAMP,
    })

    updated_doc = testimonial_ref.get()
    updated_testimonial = updated_doc.to_dict() or {}

    return serialize_testimonial(
        updated_doc.id,
        updated_testimonial,
    )


@router.delete("/{testimonial_id}", status_code=204)
def delete_client_testimonial(
    testimonial_id: str,
    authenticated_client: Annotated[
        AuthenticatedClient,
        Depends(get_authenticated_client),
    ],
):
    email = authenticated_email(authenticated_client)
    testimonial_ref, testimonial = get_owned_testimonial(
        testimonial_id,
        email,
    )
    photo_storage_path = testimonial.get("photoStoragePath")

    if isinstance(photo_storage_path, str) and photo_storage_path.strip():
        try:
            storage.bucket().blob(photo_storage_path.strip()).delete()
        except Exception as error:
            raise HTTPException(
                status_code=502,
                detail="Não foi possível remover a foto do depoimento.",
            ) from error

    testimonial_ref.delete()

    return Response(status_code=204)
