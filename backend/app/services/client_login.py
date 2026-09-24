"""Client login only: no migration, credential writes, or native-provider changes."""

from functools import lru_cache
import os
import secrets

import requests
from firebase_admin import auth

from app.services.client_emails import (
    ClientEmailError, RESERVATIONS_COLLECTION, normalize_client_email,
    normalize_client_emails,
)
from app.services.client_password_crypto import PasswordError, hash_password, verify_password
from app.services.client_passwords import CREDENTIALS_COLLECTION, ClientPasswordService


class InvalidClientLogin(Exception):
    def __init__(self):
        super().__init__("E-mail ou senha inválidos.")


class ClientLoginUnavailable(Exception):
    def __init__(self):
        super().__init__("Não foi possível entrar. Tente novamente.")


@lru_cache(maxsize=1)
def _dummy_hash():
    return hash_password(secrets.token_urlsafe(32))


def _dummy_verify(password):
    # Same Argon2id parameters as a real credential; not constant-time end to end.
    verify_password(password or "invalid-input", _dummy_hash())


def verify_legacy_password(email: str, password: str) -> str:
    api_key = os.getenv("FIREBASE_WEB_API_KEY")
    if not api_key:
        raise ClientLoginUnavailable()
    try:
        response = requests.post(
            "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword",
            params={"key": api_key},
            json={"email": email, "password": password, "returnSecureToken": True},
            timeout=(5, 15), allow_redirects=False,
        )
        if response.status_code in (400, 401, 403):
            raise InvalidClientLogin()
        if response.status_code != 200:
            raise ClientLoginUnavailable()
        payload = response.json()
        # Verify the returned ID token against this Admin SDK project, not just localId.
        decoded = auth.verify_id_token(payload["idToken"], check_revoked=True)
        uid = decoded.get("uid")
        if not isinstance(uid, str) or uid != payload.get("localId"):
            raise InvalidClientLogin()
        return uid
    except (InvalidClientLogin, ClientLoginUnavailable):
        raise
    except Exception:
        # Do not propagate request bodies, tokens, or provider exception details.
        raise ClientLoginUnavailable() from None


class ClientLoginService:
    def __init__(self, db, passwords=None, firebase_auth=auth,
                 legacy_verifier=verify_legacy_password, dummy_verifier=_dummy_verify):
        self.db = db
        self.passwords = passwords if passwords is not None else ClientPasswordService(db)
        self.firebase_auth = firebase_auth
        self.legacy_verifier = legacy_verifier
        self.dummy_verifier = dummy_verifier

    def _read(self, collection, document_id):
        snapshot = self.db.collection(collection).document(document_id).get()
        return snapshot.to_dict() if snapshot.exists else None

    def _client_for_uid(self, uid):
        matches = list(self.db.collection("clients").where("uid", "==", uid).limit(2).stream())
        if len(matches) != 1:
            raise InvalidClientLogin()
        return matches[0].id, matches[0].to_dict()

    @staticmethod
    def _uid(client):
        uid = client.get("uid") if client else None
        if (not isinstance(uid, str) or not uid or uid != uid.strip()
                or len(uid) > 128 or client.get("active") is False):
            raise InvalidClientLogin()
        return uid

    def _reserved_client(self, email):
        reservation = self._read(RESERVATIONS_COLLECTION, email.reservation_id)
        if reservation is None:
            return None
        client_id = reservation.get("clientId")
        if (reservation.get("normalizedEmail") != email.normalized
                or not isinstance(client_id, str) or not client_id or "/" in client_id):
            raise InvalidClientLogin()
        client = self._read("clients", client_id)
        self._uid(client)
        # A stale reservation must not authorize an alias removed from the Client.
        values = client["emails"] if "emails" in client else [client.get("email")]
        if email.normalized not in {item.normalized for item in normalize_client_emails(values)}:
            raise InvalidClientLogin()
        return client_id, client

    def _legacy_client(self, email):
        user = self.firebase_auth.get_user_by_email(email.normalized)
        if user.disabled:
            raise InvalidClientLogin()
        client_id, client = self._client_for_uid(user.uid)
        self._uid(client)
        # Fail closed for explicit new representation, even [] or no password.
        # Deleting a new credential must never reactivate native-password fallback.
        if ("emails" in client or self._read(CREDENTIALS_COLLECTION, client_id) is not None
                or normalize_client_email(client.get("email")).normalized != email.normalized):
            raise InvalidClientLogin()
        return client_id, client

    def login(self, email_value: str, password: str) -> str:
        hash_checked = False
        try:
            email = normalize_client_email(email_value)
            resolved = self._reserved_client(email)
            if resolved is not None:
                client_id, client = resolved
                credential = self._read(CREDENTIALS_COLLECTION, client_id)
                if credential is None:
                    raise InvalidClientLogin()
                hash_checked = True
                if not self.passwords.verify_client_password(client_id, password):
                    raise InvalidClientLogin()
                # Detect removal/change while password verification was running.
                if (self._read(CREDENTIALS_COLLECTION, client_id) != credential
                        or self._reserved_client(email) != resolved):
                    raise InvalidClientLogin()
            else:
                self.dummy_verifier(password)
                hash_checked = True
                client_id, client = self._legacy_client(email)
                uid = self.legacy_verifier(email.display, password)
                if uid != self._uid(client):
                    raise InvalidClientLogin()
                if (self._reserved_client(email) is not None
                        or self._legacy_client(email) != (client_id, client)):
                    raise InvalidClientLogin()
            uid = self._uid(client)
            if self._client_for_uid(uid)[0] != client_id:
                raise InvalidClientLogin()
            # A custom-token exchange may create an absent Auth user: forbid that here.
            user = self.firebase_auth.get_user(uid)
            if user.disabled or user.uid != uid:
                raise InvalidClientLogin()
            if self._read("clients", client_id) != client:
                raise InvalidClientLogin()
            token = self.firebase_auth.create_custom_token(uid)
            if isinstance(token, bytes):
                token = token.decode("utf-8")
            if not isinstance(token, str) or not token:
                raise ClientLoginUnavailable()
            return token
        except (ClientEmailError, PasswordError, auth.UserNotFoundError, InvalidClientLogin):
            if not hash_checked:
                self.dummy_verifier(password)
            raise InvalidClientLogin() from None
        except ClientLoginUnavailable:
            raise
        except Exception:
            raise ClientLoginUnavailable() from None
