"""Link credentials and transaction helpers; no URLs or Auth calls."""

from dataclasses import dataclass
import hashlib
import hmac
import re
import secrets
from uuid import uuid4

from firebase_admin import firestore

from app.services.client_password_crypto import EnvironmentPasswordKeys
from app.services.secret_crypto import encrypt_secret, decrypt_secret, InvalidEncryptedSecret


CREDENTIALS_COLLECTION = "clientLinkCredentials"
LOOKUP_COLLECTION = "clientLinkLookup"


class ClientLinkError(ValueError):
    pass


class ClientLinkAbsent(ClientLinkError):
    pass


class ClientLinkRevoked(ClientLinkError):
    pass


class InvalidClientLink(ClientLinkError):
    pass


class RecoveredClientLink:
    """Sensitive return value; no dict/dataclass serialization or plaintext repr."""
    __slots__ = ("public_id", "credential_version", "_secret")

    def __init__(self, public_id, version, secret):
        self.public_id, self.credential_version, self._secret = public_id, version, secret

    @property
    def secret(self):
        return self._secret

    def __repr__(self):
        return "<RecoveredClientLink secret=[REDACTED]>"


@dataclass(frozen=True)
class ValidatedClientLink:
    client_id: str
    uid: str
    credential_version: str


def _hash(secret):
    return hashlib.sha256(secret.encode("ascii")).hexdigest()


def _context(record):
    return ["client-link", 1, record["clientId"], record["publicId"], record["credentialVersion"]]


def _safe_id(value):
    return isinstance(value, str) and bool(value) and "/" not in value


class ClientLinkService:
    def __init__(self, db=None, keys=None):
        self._db = db
        self.keys = keys if keys is not None else EnvironmentPasswordKeys()

    def _database(self):
        if self._db is None:
            from app.firebase.firestore import db
            return db
        return self._db

    @staticmethod
    def _read(ref, transaction):
        snapshot = ref.get(transaction=transaction)
        return snapshot.to_dict() if snapshot.exists else None

    def _current(self, db, transaction, client_id):
        if not _safe_id(client_id):
            raise InvalidClientLink("Identificador de Cliente inválido.")
        client = self._read(db.collection("clients").document(client_id), transaction)
        if client is None:
            raise InvalidClientLink("Cliente inexistente.")
        ref = db.collection(CREDENTIALS_COLLECTION).document(client_id)
        record = self._read(ref, transaction)
        lookup_ref = None
        if record is not None:
            if (record.get("clientId") != client_id
                    or not isinstance(record.get("publicId"), str)
                    or not re.fullmatch(r"[A-Za-z0-9_-]{22}", record["publicId"])
                    or not isinstance(record.get("credentialVersion"), str)
                    or not record["credentialVersion"]
                    or type(record.get("active")) is not bool):
                raise InvalidClientLink("Credencial de link inconsistente.")
            lookup_ref = db.collection(LOOKUP_COLLECTION).document(record["publicId"])
            lookup = self._read(lookup_ref, transaction)
            expected = {"clientId": client_id, "credentialVersion": record["credentialVersion"]}
            if (record["active"] and lookup != expected) or (not record["active"] and lookup is not None):
                raise InvalidClientLink("Índice de link inconsistente.")
        return client, ref, record, lookup_ref

    def _recover(self, record):
        try:
            secret = decrypt_secret(record["encryptedSecret"], _context(record), self.keys).decode("ascii")
            if (not re.fullmatch(r"[A-Za-z0-9_-]{43}", secret)
                    or not hmac.compare_digest(_hash(secret), record["secretHash"])):
                raise InvalidClientLink("Credencial de link inválida.")
        except (KeyError, TypeError, UnicodeDecodeError, InvalidEncryptedSecret):
            raise InvalidClientLink("Falha na recuperação da credencial de link.") from None
        return RecoveredClientLink(record["publicId"], record["credentialVersion"], secret)

    def _new_record(self, client_id):
        secret = secrets.token_urlsafe(32)
        record = {
            "clientId": client_id, "publicId": secrets.token_urlsafe(16),
            "secretHash": _hash(secret), "credentialVersion": str(uuid4()),
            "active": True, "createdAt": firestore.SERVER_TIMESTAMP,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        }
        record["encryptedSecret"] = encrypt_secret(secret.encode("ascii"), _context(record), self.keys)
        return record

    def prepare_new_link(self, client_id):
        """Prepare once before external effects, reuse across transaction retries."""
        if not _safe_id(client_id):
            raise InvalidClientLink("Identificador de Cliente inválido.")
        return self._new_record(client_id)

    def read_new_link_availability(self, transaction, record):
        """Provisioning calls this before any transaction writes."""
        db = self._database()
        current = self._read(db.collection(CREDENTIALS_COLLECTION).document(record["clientId"]), transaction)
        lookup = self._read(db.collection(LOOKUP_COLLECTION).document(record["publicId"]), transaction)
        if current is not None or lookup is not None:
            raise InvalidClientLink("Identificador de credencial já utilizado.")

    def write_prepared_link(self, transaction, record):
        db = self._database()
        transaction.set(db.collection(CREDENTIALS_COLLECTION).document(record["clientId"]), record)
        transaction.set(db.collection(LOOKUP_COLLECTION).document(record["publicId"]), {
            "clientId": record["clientId"], "credentialVersion": record["credentialVersion"],
        })

    def prepared_link_is_persisted(self, record, transaction=None):
        """Confirm the exact candidate when reconciling a lost commit response."""
        db = self._database()
        current = self._read(db.collection(CREDENTIALS_COLLECTION).document(record["clientId"]), transaction)
        lookup = self._read(db.collection(LOOKUP_COLLECTION).document(record["publicId"]), transaction)
        return (current is not None and all(current.get(k) == v for k, v in record.items()
                                           if k not in {"createdAt", "updatedAt"})
                and lookup == {"clientId": record["clientId"],
                               "credentialVersion": record["credentialVersion"]})

    def _issue(self, client_id, regenerate):
        db = self._database()
        # Lazily prepare once per operation, reuse during Firestore retries.
        candidate = None

        @firestore.transactional
        def issue(transaction):
            nonlocal candidate
            _, ref, current, old_lookup_ref = self._current(db, transaction, client_id)
            if current is not None and not regenerate:
                if not current["active"]:
                    raise ClientLinkRevoked("Link revogado. Regeneração explícita necessária.")
                return self._recover(current)
            if candidate is None:
                candidate = self.prepare_new_link(client_id)
            new_lookup_ref = db.collection(LOOKUP_COLLECTION).document(candidate["publicId"])
            if self._read(new_lookup_ref, transaction) is not None:
                raise InvalidClientLink("Colisão de identificador público. Tente novamente.")
            result = self._recover(candidate)
            record = {**candidate, "createdAt": current["createdAt"] if current else candidate["createdAt"]}
            if current and current["active"]:
                transaction.delete(old_lookup_ref)
            self.write_prepared_link(transaction, record)
            return result

        return issue(db.transaction())

    def get_or_create(self, client_id):
        return self._issue(client_id, regenerate=False)

    def regenerate(self, client_id):
        return self._issue(client_id, regenerate=True)

    def reveal(self, client_id):
        db = self._database()

        @firestore.transactional
        def reveal_current(transaction):
            _, _, record, _ = self._current(db, transaction, client_id)
            if record is None:
                raise ClientLinkAbsent("Cliente sem credencial de link.")
            if not record["active"]:
                raise ClientLinkRevoked("Link revogado.")
            return self._recover(record)

        return reveal_current(db.transaction())

    def has_active_link(self, client_id):
        db = self._database()

        @firestore.transactional
        def check(transaction):
            _, _, record, _ = self._current(db, transaction, client_id)
            return record is not None and record["active"]

        return check(db.transaction())

    def revoke(self, client_id):
        db = self._database()

        @firestore.transactional
        def revoke_current(transaction):
            _, ref, record, lookup_ref = self._current(db, transaction, client_id)
            if record is not None and record["active"]:
                transaction.delete(lookup_ref)
                transaction.update(ref, {"active": False, "updatedAt": firestore.SERVER_TIMESTAMP})

        revoke_current(db.transaction())

    def validate(self, public_id, secret):
        """Return non-secret identity or None; never decrypt for authentication."""
        if (not isinstance(public_id, str) or not re.fullmatch(r"[A-Za-z0-9_-]{22}", public_id)
                or not isinstance(secret, str) or not re.fullmatch(r"[A-Za-z0-9_-]{43}", secret)):
            return None
        db = self._database()

        @firestore.transactional
        def validate_current(transaction):
            lookup = self._read(db.collection(LOOKUP_COLLECTION).document(public_id), transaction)
            if lookup is None or not _safe_id(lookup.get("clientId")):
                return None
            client_id = lookup["clientId"]
            client, _, record, _ = self._current(db, transaction, client_id)
            if (record is None or not record["active"] or record["publicId"] != public_id
                    or lookup.get("credentialVersion") != record["credentialVersion"]
                    or client.get("active") is False):
                return None
            uid = client.get("uid")
            stored_hash = record.get("secretHash")
            if (not isinstance(uid, str) or not uid or uid != uid.strip() or len(uid) > 128
                    or not isinstance(stored_hash, str) or not re.fullmatch(r"[0-9a-f]{64}", stored_hash)
                    or not hmac.compare_digest(_hash(secret), stored_hash)):
                return None
            return ValidatedClientLink(client_id, uid, record["credentialVersion"])

        try:
            return validate_current(db.transaction())
        except ClientLinkError:
            return None
