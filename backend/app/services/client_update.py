"""Coordinate updates to an existing Client identity."""

from firebase_admin import firestore

from app.models.client_provisioning import UpdateClientRequest

from app.services.client_emails import replace_client_emails

from app.services.client_passwords import ClientPasswordService

class ClientUpdateNotFound(Exception):
    pass


class InvalidClientUpdate(ValueError):
    pass


class ClientUpdateService:
    def __init__(self, db):
        self.db = db

    def update(
        self,
        client_id: str,
        request: UpdateClientRequest,
    ) -> dict:
        if (
            not isinstance(client_id, str)
            or not client_id
            or "/" in client_id
        ):
            raise ClientUpdateNotFound(
                "Identificador de Cliente inválido."
            )

        client_ref = (
            self.db
            .collection("clients")
            .document(client_id)
        )

        snapshot = client_ref.get()

        if not snapshot.exists:
            raise ClientUpdateNotFound(
                "Cliente inexistente."
            )

        if request.password is not None and not request.emails:
            raise InvalidClientUpdate(
                "Senha exige pelo menos um e-mail."
            )

        public_updates = {
            "name": (request.name or "").strip(),
            "phone": (request.phone or "").strip(),
            "active": request.active,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        }

        client_ref.update(public_updates)

        emails = replace_client_emails(
            client_id,
            request.emails,
        )

        password_changed = False

        if request.password is not None:

            password_service = ClientPasswordService(
                self.db
            )

            password_service.change_client_password(
                client_id,
                request.password.get_secret_value(),
            )

            password_changed = True

        return {
            "clientId": client_id,
            "name": public_updates["name"],
            "phone": public_updates["phone"],
            "emails": emails,
            "active": public_updates["active"],
            "passwordChanged": password_changed,
        }