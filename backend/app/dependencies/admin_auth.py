from dataclasses import dataclass
from typing import Annotated

from fastapi import Header, HTTPException
from firebase_admin import auth

from app.dependencies.client_auth import verify_firebase_id_token
from app.firebase.firestore import db


@dataclass(frozen=True)
class AuthenticatedAdmin:
    uid: str


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=401,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_authenticated_admin(
    authorization: Annotated[str | None, Header()] = None,
) -> AuthenticatedAdmin:
    if not authorization:
        raise _unauthorized("Token de autenticação ausente.")

    scheme, separator, token = authorization.partition(" ")

    if (
        not separator
        or scheme.lower() != "bearer"
        or not token.strip()
    ):
        raise _unauthorized("Token de autenticação inválido.")

    try:
        decoded_token = verify_firebase_id_token(token.strip())
    except auth.CertificateFetchError as error:
        raise HTTPException(
            status_code=503,
            detail="Não foi possível validar a autenticação no momento.",
        ) from error
    except (
        auth.ExpiredIdTokenError,
        auth.RevokedIdTokenError,
        auth.UserDisabledError,
        auth.InvalidIdTokenError,
        auth.UserNotFoundError,
        TypeError,
        ValueError,
    ) as error:
        raise _unauthorized(
            "Token de autenticação inválido ou expirado."
        ) from error

    uid = decoded_token.get("uid")

    if not isinstance(uid, str) or not uid.strip():
        raise _unauthorized(
            "A identidade autenticada não possui um identificador válido."
        )

    normalized_uid = uid.strip()
    admin_document = db.collection("admins").document(normalized_uid).get()

    if not admin_document.exists:
        raise HTTPException(
            status_code=403,
            detail="Administrador não autorizado.",
        )

    return AuthenticatedAdmin(uid=normalized_uid)
