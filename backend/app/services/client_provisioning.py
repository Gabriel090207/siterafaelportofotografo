"""Coordinate new Clients only; never migrate or update existing identities."""

import logging

from firebase_admin import auth, firestore
from google.api_core.exceptions import Aborted, AlreadyExists, FailedPrecondition, InvalidArgument

from app.models.client_provisioning import ProvisionClientRequest
from app.services.client_emails import (
    ClientEmailError, normalize_client_emails,
    read_email_reservations, write_email_reservations,
)
from app.services.client_passwords import CREDENTIALS_COLLECTION, prepare_client_password
from app.services.client_links import ClientLinkService, ClientLinkError


logger = logging.getLogger(__name__)


class InvalidClientProvisioning(ValueError):
    pass


class ClientProvisioningUnavailable(Exception):
    pass


class ClientProvisioningReconciliationRequired(ClientProvisioningUnavailable):
    pass


class ClientProvisioningService:
    def __init__(self, db, firebase_auth=auth, keys=None):
        self.db = db
        self.firebase_auth = firebase_auth
        self.keys = keys

    def provision(self, request: ProvisionClientRequest) -> dict:
        desired = normalize_client_emails(request.emails)
        if request.password is not None and not desired:
            raise InvalidClientProvisioning("Senha exige pelo menos um e-mail.")
        client_ref = self.db.collection("clients").document()
        client_id = client_ref.id
        credential = None
        if request.password is not None:
            # Includes empty-password/key validation and hashing before external effects.
            credential = prepare_client_password(
                client_id, request.password.get_secret_value(), self.keys,
            )
        emails = [email.display for email in desired]
        public = {
            "name": (request.name or "").strip(),
            "phone": (request.phone or "").strip(),
            "emails": emails, "email": emails[0] if emails else "",
            "active": request.active, "role": "client", "albumsCount": 0,
        }
        # Advisory preflight uses the same reservation rules, not a clients scan.
        # The transaction below remains the sole authority under concurrency.
        read_email_reservations(self.db, None, client_id, desired)
        links = ClientLinkService(self.db, self.keys)
        link = links.prepare_new_link(client_id)
        try:
            user = self.firebase_auth.create_user()  # No native email or password.
        except Exception:
            # A transport failure can hide a successful Auth creation. No UID is
            # available to delete safely; never delete by a submitted email.
            logger.error("client_provisioning_auth_create_outcome_unknown clientId=%s", client_id)
            raise ClientProvisioningReconciliationRequired(
                "Criação da identidade requer verificação operacional."
            ) from None
        uid = user.uid
        public["uid"] = uid
        credential_ref = self.db.collection(CREDENTIALS_COLLECTION).document(client_id)

        @firestore.transactional
        def create(transaction):
            existing = client_ref.get(transaction=transaction)
            if existing.exists:
                # Never overwrite an unrelated Client, even in an ID collision.
                if (all((existing.to_dict() or {}).get(k) == v for k, v in public.items())
                        and links.prepared_link_is_persisted(link, transaction)):
                    return
                raise InvalidClientProvisioning("Identificador de Cliente já utilizado.")
            if credential_ref.get(transaction=transaction).exists:
                raise InvalidClientProvisioning("Identificador de credencial já utilizado.")
            reservations = read_email_reservations(self.db, transaction, client_id, desired)
            links.read_new_link_availability(transaction, link)
            transaction.set(client_ref, {
                **public, "createdAt": firestore.SERVER_TIMESTAMP,
                "updatedAt": firestore.SERVER_TIMESTAMP,
            })
            write_email_reservations(
                transaction, client_id, {email.normalized for email in desired}, reservations,
            )
            if credential is not None:
                transaction.set(credential_ref, credential)
            links.write_prepared_link(transaction, link)

        try:
            create(self.db.transaction())
        except Exception as error:
            # A commit response may be lost AFTER commit. Never blindly delete Auth.
            try:
                snapshot = client_ref.get()
                client_matches = snapshot.exists and all(
                    (snapshot.to_dict() or {}).get(k) == v for k, v in public.items()
                )
                committed = client_matches and links.prepared_link_is_persisted(link)
            except Exception:
                self._reconciliation(client_id, uid, "commit_status_unavailable")
            if not committed:
                if snapshot.exists:
                    self._reconciliation(client_id, uid, "incomplete_or_conflicting_commit")
                definitive = isinstance(error, (
                    ClientEmailError, InvalidClientProvisioning, ClientLinkError,
                    Aborted, AlreadyExists, FailedPrecondition, InvalidArgument,
                ))
                if not definitive:
                    # Timeout/unavailable may still commit remotely. Keep the user
                    # for reconciliation rather than leave a committed Client UID-less.
                    self._reconciliation(client_id, uid, "commit_outcome_unknown")
                try:
                    self.firebase_auth.delete_user(uid)
                except auth.UserNotFoundError:
                    pass
                except Exception:
                    self._reconciliation(client_id, uid, "auth_compensation_failed")
                if isinstance(error, (ClientEmailError, InvalidClientProvisioning)):
                    raise error from None
                raise ClientProvisioningUnavailable("Falha ao provisionar Cliente.") from None
        return {"clientId": client_id, **public, "hasPassword": credential is not None}

    @staticmethod
    def _reconciliation(client_id, uid, reason):
        # Identifiers/status only: no email, request, exception text, or secrets.
        logger.error("client_provisioning_reconciliation_required clientId=%s uid=%s reason=%s",
                     client_id, uid, reason)
        raise ClientProvisioningReconciliationRequired(
            "Provisionamento requer reconciliação operacional."
        ) from None
