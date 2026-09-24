"""Coordinate updates to an existing Client identity."""

from firebase_admin import firestore

from app.models.client_provisioning import UpdateClientRequest


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

        data = snapshot.to_dict() or {}

        return {
            "clientId": client_id,
            "name": data.get("name", ""),
            "phone": data.get("phone", ""),
            "emails": data.get("emails", []),
            "active": data.get("active", True),
        }