"""Backend-only email reservations. Not connected to legacy writers.

Uniqueness covers participating writers only; unindexed legacy clients need
a controlled migration before this becomes the global uniqueness authority.
Browser access to clientEmailReservations must be denied by deployed rules.
"""

from dataclasses import dataclass
from hashlib import sha256
from typing import Any
import unicodedata

from email_validator import EmailNotValidError, validate_email
from firebase_admin import firestore


MAX_CLIENT_EMAILS = 10
RESERVATIONS_COLLECTION = "clientEmailReservations"


class ClientEmailError(ValueError):
    """Invalid email operation."""


class InvalidClientEmail(ClientEmailError):
    pass


class TooManyClientEmails(ClientEmailError):
    pass


class DuplicateClientEmail(ClientEmailError):
    pass


class ClientEmailConflict(ClientEmailError):
    pass


class ClientNotFound(ClientEmailError):
    pass


class InvalidEmailReservation(ClientEmailError):
    pass


@dataclass(frozen=True)
class ClientEmail:
    display: str
    normalized: str

    @property
    def reservation_id(self) -> str:
        return sha256(self.normalized.encode("utf-8")).hexdigest()


def normalize_client_email(value: Any) -> ClientEmail:
    if not isinstance(value, str) or not value.strip():
        raise InvalidClientEmail("O e-mail deve ser uma string preenchida.")
    display = value.strip()
    try:
        validated = validate_email(display, check_deliverability=False)
    except EmailNotValidError as error:
        raise InvalidClientEmail("Formato de e-mail inválido.") from error
    # Use ASCII IDNA domain so Unicode/punycode representations share a key.
    normalized = unicodedata.normalize(
        "NFC", f"{validated.local_part}@{validated.ascii_domain}".casefold()
    )
    return ClientEmail(display=display, normalized=normalized)


def normalize_client_emails(values: Any) -> list[ClientEmail]:
    if not isinstance(values, list):
        raise InvalidClientEmail("Os e-mails devem ser uma lista.")
    if len(values) > MAX_CLIENT_EMAILS:
        raise TooManyClientEmails("O limite é de 10 e-mails por Cliente.")
    result = []
    seen = set()
    for value in values:
        email = normalize_client_email(value)
        if email.normalized in seen:
            raise DuplicateClientEmail("E-mail duplicado na mesma lista.")
        seen.add(email.normalized)
        result.append(email)
    return result


def read_email_reservations(db, transaction, client_id, emails):
    """Read and validate ownership before a caller queues any writes."""
    reservations = {}
    for email in emails:
        key = email.normalized
        ref = db.collection(RESERVATIONS_COLLECTION).document(email.reservation_id)
        reservation = ref.get(transaction=transaction)
        payload = reservation.to_dict() if reservation.exists else None
        if payload is not None:
            if payload.get("normalizedEmail") != key or not payload.get("clientId"):
                raise InvalidEmailReservation("Reserva de e-mail inconsistente.")
            if payload["clientId"] != client_id:
                raise ClientEmailConflict("E-mail reservado para outro Cliente.")
        reservations[key] = (ref, payload)
    return reservations


def write_email_reservations(transaction, client_id, desired_keys, reservations):
    """Queue changes using ownership already checked by read_email_reservations."""
    for key, (ref, payload) in reservations.items():
        if key in desired_keys and payload is None:
            transaction.set(ref, {
                "normalizedEmail": key,
                "clientId": client_id,
                "createdAt": firestore.SERVER_TIMESTAMP,
            })
        elif key not in desired_keys and payload is not None:
            transaction.delete(ref)


def _replace_in_transaction(db, transaction, client_id, desired):
    client_ref = db.collection("clients").document(client_id)
    snapshot = client_ref.get(transaction=transaction)
    if not snapshot.exists:
        raise ClientNotFound("Cliente inexistente.")
    data = snapshot.to_dict() or {}
    # Never fall back to legacy email when emails is explicitly present.
    previous = data["emails"] if "emails" in data else (
        [data["email"]] if data.get("email") else []
    )
    current = normalize_client_emails(previous)
    old = {email.normalized: email for email in current}
    new = {email.normalized: email for email in desired}
    # All reads and validation precede any queued writes. Reading the Client
    # also serializes concurrent replacements of this Client's list.
    reservations = read_email_reservations(db, transaction, client_id, (old | new).values())
    write_email_reservations(transaction, client_id, new, reservations)

    displays = [email.display for email in desired]
    if data.get("emails") != displays or "emails" not in data:
        # Legacy email is deliberately untouched: testimonials still use it.
        transaction.update(client_ref, {
            "emails": displays,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        })
    return displays


def replace_client_emails(client_id: str, emails: Any) -> list[str]:
    """Atomically replace emails for an existing Client when explicitly called.

    No endpoint calls this yet. Importing this module does not initialize Firebase.
    """
    if not isinstance(client_id, str) or not client_id or "/" in client_id:
        raise ClientNotFound("Identificador de Cliente inválido.")
    desired = normalize_client_emails(emails)
    from app.firebase.firestore import db

    @firestore.transactional
    def replace(transaction):
        return _replace_in_transaction(db, transaction, client_id, desired)

    return replace(db.transaction())
