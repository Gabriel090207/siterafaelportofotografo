from dataclasses import dataclass
from typing import Annotated, Any

from fastapi import Header, HTTPException
from firebase_admin import auth

from app.firebase.firestore import db


FIREBASE_ID_TOKEN_CLOCK_SKEW_SECONDS = 5


@dataclass(frozen=True)
class AuthenticatedClient:
    id: str
    uid: str
    name: str
    email: str


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=401,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def _text_value(value: Any) -> str:
    if isinstance(value, str):
        return value.strip()

    return ""


def verify_firebase_id_token(token: str) -> dict[str, Any]:
    return auth.verify_id_token(
        token,
        check_revoked=True,
        clock_skew_seconds=FIREBASE_ID_TOKEN_CLOCK_SKEW_SECONDS,
    )


def get_authenticated_client(
    authorization: Annotated[str | None, Header()] = None,
) -> AuthenticatedClient:
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
    clients = (
        db.collection("clients")
        .where("uid", "==", normalized_uid)
        .limit(1)
        .stream()
    )
    client_document = next(clients, None)

    if client_document is None:
        raise HTTPException(
            status_code=403,
            detail="Cliente não autorizado.",
        )

    client = client_document.to_dict() or {}

    if client.get("active") is False:
        raise HTTPException(
            status_code=403,
            detail="Cliente inativo.",
        )

    return AuthenticatedClient(
        id=client_document.id,
        uid=normalized_uid,
        name=_text_value(client.get("name")),
        email=_text_value(client.get("email")),
    )
