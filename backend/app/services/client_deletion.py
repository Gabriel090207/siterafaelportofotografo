"""Coordinate permanent Client deletion."""

import logging

from firebase_admin import auth, firestore

from app.services.client_emails import (
    RESERVATIONS_COLLECTION,
    normalize_client_emails,
)
from app.services.client_passwords import (
    CREDENTIALS_COLLECTION as PASSWORD_CREDENTIALS_COLLECTION,
)
from app.services.client_links import (
    CREDENTIALS_COLLECTION as LINK_CREDENTIALS_COLLECTION,
    LOOKUP_COLLECTION as LINK_LOOKUP_COLLECTION,
)


logger = logging.getLogger(__name__)


class ClientDeletionError(Exception):
    pass


class ClientDeletionNotFound(ClientDeletionError):
    pass


class InvalidClientDeletion(ClientDeletionError):
    pass


class ClientDeletionReconciliationRequired(ClientDeletionError):
    pass


class ClientDeletionService:
    def __init__(self, db, firebase_auth=auth):
        self.db = db
        self.firebase_auth = firebase_auth

    def delete(self, client_id: str) -> None:
        if (
            not isinstance(client_id, str)
            or not client_id
            or "/" in client_id
        ):
            raise ClientDeletionNotFound("Cliente inexistente.")

        client_ref = self.db.collection("clients").document(client_id)

        @firestore.transactional
        def delete_firestore_identity(transaction):
            snapshot = client_ref.get(transaction=transaction)

            if not snapshot.exists:
                raise ClientDeletionNotFound("Cliente inexistente.")

            client = snapshot.to_dict() or {}

            uid = client.get("uid")

            if (
                not isinstance(uid, str)
                or not uid
                or uid != uid.strip()
                or len(uid) > 128
            ):
                raise InvalidClientDeletion(
                    "Cliente possui identidade inválida."
                )

            raw_emails = (
                client["emails"]
                if "emails" in client
                else ([client["email"]] if client.get("email") else [])
            )

            emails = normalize_client_emails(raw_emails)

            # Validate every email reservation before queuing deletions.
            reservation_refs = []

            for email in emails:
                ref = self.db.collection(
                    RESERVATIONS_COLLECTION
                ).document(email.reservation_id)

                reservation = ref.get(transaction=transaction)

                if not reservation.exists:
                    # Legacy Clients may predate clientEmailReservations.
                    continue

                data = reservation.to_dict() or {}

                if (
                    data.get("normalizedEmail") != email.normalized
                    or data.get("clientId") != client_id
                ):
                    raise InvalidClientDeletion(
                        "Reserva de e-mail inconsistente."
                    )

                reservation_refs.append(ref)

            password_ref = self.db.collection(
                PASSWORD_CREDENTIALS_COLLECTION
            ).document(client_id)

            link_ref = self.db.collection(
                LINK_CREDENTIALS_COLLECTION
            ).document(client_id)

            link_snapshot = link_ref.get(transaction=transaction)
            link_data = (
                link_snapshot.to_dict()
                if link_snapshot.exists
                else None
            )

            link_lookup_ref = None

            if link_data is not None:
                if link_data.get("clientId") != client_id:
                    raise InvalidClientDeletion(
                        "Credencial de link inconsistente."
                    )

                public_id = link_data.get("publicId")

                if not isinstance(public_id, str) or not public_id:
                    raise InvalidClientDeletion(
                        "Credencial de link inconsistente."
                    )

                link_lookup_ref = self.db.collection(
                    LINK_LOOKUP_COLLECTION
                ).document(public_id)

                lookup_snapshot = link_lookup_ref.get(
                    transaction=transaction
                )

                lookup_data = (
                    lookup_snapshot.to_dict()
                    if lookup_snapshot.exists
                    else None
                )

                if link_data.get("active") is True:
                    expected = {
                        "clientId": client_id,
                        "credentialVersion": link_data.get(
                            "credentialVersion"
                        ),
                    }

                    if lookup_data != expected:
                        raise InvalidClientDeletion(
                            "Índice de link inconsistente."
                        )
                elif lookup_data is not None:
                    raise InvalidClientDeletion(
                        "Índice de link inconsistente."
                    )

            # All validation/reads happen before writes.
            for ref in reservation_refs:
                transaction.delete(ref)

            transaction.delete(password_ref)

            if link_lookup_ref is not None:
                transaction.delete(link_lookup_ref)

            transaction.delete(link_ref)
            transaction.delete(client_ref)

            return uid

        uid = delete_firestore_identity(self.db.transaction())

        try:
            self.firebase_auth.delete_user(uid)
        except auth.UserNotFoundError:
            # Firestore identity is already gone and Auth is already absent.
            return
        except Exception:
            logger.error(
                "client_deletion_reconciliation_required "
                "clientId=%s uid=%s reason=auth_delete_failed",
                client_id,
                uid,
            )

            raise ClientDeletionReconciliationRequired(
                "Exclusão requer reconciliação operacional."
            ) from None