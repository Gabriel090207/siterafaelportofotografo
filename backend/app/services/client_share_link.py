"""Administrative link recovery; the complete URL exists only in memory."""
import os
from urllib.parse import urlsplit

from app.services.client_links import ClientLinkService


class ClientShareLinkConfigurationError(ValueError):
    pass


class ClientShareLinkNotFound(ValueError):
    pass


def public_frontend_base():
    value = os.environ.get("PUBLIC_FRONTEND_URL", "").strip()
    try:
        url = urlsplit(value)
        port = url.port  # Reject malformed ports before creating credentials.
        if (url.scheme not in {"https", "http"} or not url.hostname
                or url.username is not None or url.password is not None
                or url.path not in {"", "/"} or url.query or url.fragment
                or any(char.isspace() or ord(char) < 32 for char in value)
                or "\\" in value or port == 0
                or (url.scheme == "http" and url.hostname not in {"localhost", "127.0.0.1", "::1"})):
            raise ValueError()
    except ValueError:
        raise ClientShareLinkConfigurationError("URL pública do frontend não configurada corretamente.") from None
    return value.rstrip("/")


class ClientShareLinkService:
    def __init__(self, db, links=None):
        self.db = db
        self.links = links if links is not None else ClientLinkService(db)

    def get_or_create(self, client_id):
        base = public_frontend_base()
        if not self.db.collection("clients").document(client_id).get().exists:
            raise ClientShareLinkNotFound("Cliente não encontrado.")
        link = self.links.get_or_create(client_id)
        return {"shareLink": f"{base}/cliente/acesso#{link.public_id}.{link.secret}"}
