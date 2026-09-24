"""Internal password storage. No routes, login integration or Firebase Auth calls.

Before use, deployed Firestore rules MUST deny all browser access to
clientPasswordCredentials. The collection name alone does not enforce privacy.
Future callers must authorize set/delete/reveal (especially administrative reveal).
"""

from uuid import uuid4

from firebase_admin import firestore

from app.services.client_password_crypto import (
    InvalidPasswordCredential, PasswordError, decrypt_password, encrypt_password,
    hash_password, password_bytes, verify_password,
)


CREDENTIALS_COLLECTION = "clientPasswordCredentials"


class PasswordClientNotFound(PasswordError):
    pass


class ClientPasswordAbsent(PasswordError):
    pass


def prepare_client_password(client_id: str, password: str, keys=None) -> dict:
    """Build a complete private record without writes or nested transactions."""
    version = str(uuid4())
    encrypted = encrypt_password(password, client_id, version, keys)
    hashed = hash_password(password)
    return {
        "clientId": client_id,
        "passwordHash": hashed,
        "encryptedPassword": encrypted,
        "credentialVersion": version,
        "createdAt": firestore.SERVER_TIMESTAMP,
        "updatedAt": firestore.SERVER_TIMESTAMP,
    }


class ClientPasswordService:
    def __init__(self, db=None, keys=None):
        self._db = db
        self._keys = keys

    def _database(self):
        if self._db is None:
            from app.firebase.firestore import db
            return db
        return self._db

    @staticmethod
    def _validate_id(client_id):
        if not isinstance(client_id, str) or not client_id or "/" in client_id:
            raise PasswordClientNotFound("Identificador de Cliente inválido.")

    def _credential_ref(self, client_id):
        self._validate_id(client_id)
        return self._database().collection(CREDENTIALS_COLLECTION).document(client_id)

    def _read(self, client_id):
        snapshot = self._credential_ref(client_id).get()
        if not snapshot.exists:
            return None
        data = snapshot.to_dict() or {}
        if (data.get("clientId") != client_id
                or not isinstance(data.get("credentialVersion"), str)
                or not data["credentialVersion"]):
            raise InvalidPasswordCredential("Identidade de credencial inválida.")
        return data

    def set_client_password(self, client_id: str, password: str) -> str:
        """Create or replace the single credential; return its opaque version."""
        self._validate_id(client_id)
        # Prepare both representations before any write. No plaintext in record.
        credential = prepare_client_password(client_id, password, self._keys)
        db = self._database()
        client_ref = db.collection("clients").document(client_id)
        credential_ref = db.collection(CREDENTIALS_COLLECTION).document(client_id)

        @firestore.transactional
        def replace(transaction):
            if not client_ref.get(transaction=transaction).exists:
                raise PasswordClientNotFound("Cliente inexistente.")
            previous = credential_ref.get(transaction=transaction)
            previous_data = previous.to_dict() or {}
            transaction.set(credential_ref, {
                **credential,
                "createdAt": previous_data.get("createdAt", firestore.SERVER_TIMESTAMP),
                "updatedAt": firestore.SERVER_TIMESTAMP,
            })

        replace(db.transaction())
        return credential["credentialVersion"]

    def change_client_password(self, client_id: str, password: str) -> str:
        """Same atomic replacement as set; also valid when no password exists."""
        return self.set_client_password(client_id, password)

    def verify_client_password(self, client_id: str, password: str) -> bool:
        password_bytes(password)
        data = self._read(client_id)
        return data is not None and verify_password(password, data.get("passwordHash"))

    def reveal_client_password(self, client_id: str) -> str:
        """Caller must authorize administrative disclosure. Returns plaintext in memory only."""
        data = self._read(client_id)
        if data is None:
            raise ClientPasswordAbsent("Cliente sem credencial de senha.")
        return decrypt_password(
            data.get("encryptedPassword"), client_id, data["credentialVersion"], self._keys,
        )

    def has_client_password(self, client_id: str) -> bool:
        return self._read(client_id) is not None

    def delete_client_password(self, client_id: str) -> None:
        """Idempotent removal; does not revoke Firebase sessions."""
        self._credential_ref(client_id).delete()
