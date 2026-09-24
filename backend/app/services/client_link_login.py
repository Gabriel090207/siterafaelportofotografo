"""Exchange a validated current link for a minimal canonical-UID custom token."""
from firebase_admin import auth

from app.services.client_links import ClientLinkService


class InvalidClientLinkLogin(Exception):
    def __init__(self):
        super().__init__("Link inválido ou indisponível.")


class ClientLinkLoginUnavailable(Exception):
    def __init__(self):
        super().__init__("Link inválido ou indisponível.")


class ClientLinkLoginService:
    def __init__(self, db, links=None, firebase_auth=auth):
        self.db = db
        self.links = links if links is not None else ClientLinkService(db)
        self.firebase_auth = firebase_auth

    def exchange(self, public_id: str, secret: str) -> str:
        try:
            identity = self.links.validate(public_id, secret)
            if identity is None:
                raise InvalidClientLinkLogin()
            client_ref = self.db.collection("clients").document(identity.client_id)
            snapshot = client_ref.get()
            client = snapshot.to_dict() if snapshot.exists else None
            if (not client or client.get("active") is not True
                    or client.get("uid") != identity.uid):
                raise InvalidClientLinkLogin()
            # Match the password login's one-Client-per-UID authorization boundary.
            matches = list(self.db.collection("clients").where("uid", "==", identity.uid).limit(2).stream())
            if len(matches) != 1 or matches[0].id != identity.client_id:
                raise InvalidClientLinkLogin()
            user = self.firebase_auth.get_user(identity.uid)
            if user.disabled or user.uid != identity.uid:
                raise InvalidClientLinkLogin()
            # Recheck through the same service after external Auth I/O, including
            # credentialVersion. No copied lookup/hash/AEAD implementation here.
            if self.links.validate(public_id, secret) != identity:
                raise InvalidClientLinkLogin()
            latest = client_ref.get()
            if not latest.exists or latest.to_dict() != client:
                raise InvalidClientLinkLogin()
            token = self.firebase_auth.create_custom_token(identity.uid)
            if isinstance(token, bytes):
                token = token.decode("utf-8")
            if not isinstance(token, str) or not token:
                raise ClientLinkLoginUnavailable()
            return token
        except (InvalidClientLinkLogin, auth.UserNotFoundError):
            raise InvalidClientLinkLogin() from None
        except Exception:
            # Never propagate SDK/request details containing secrets or tokens.
            raise ClientLinkLoginUnavailable() from None
