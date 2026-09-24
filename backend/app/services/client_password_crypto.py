"""Password crypto only. No Firebase initialization or secret loading on import."""

import base64
import binascii
import json
import os

from cryptography.exceptions import InvalidKey
from cryptography.hazmat.primitives.kdf.argon2 import Argon2id


from app.services.secret_crypto import encrypt_secret, decrypt_secret, InvalidEncryptedSecret


class PasswordError(ValueError):
    pass


class InvalidPassword(PasswordError):
    pass


class PasswordKeyConfigurationError(PasswordError):
    pass


class InvalidPasswordCredential(PasswordError):
    pass


def password_bytes(password: str) -> bytes:
    if not isinstance(password, str) or password == "":
        raise InvalidPassword("A senha deve ser uma string não vazia.")
    try:
        return password.encode("utf-8")
    except UnicodeEncodeError:
        raise InvalidPassword("A senha deve ser texto UTF-8 válido.") from None


def hash_password(password: str) -> str:
    value = password_bytes(password)
    return Argon2id(
        salt=os.urandom(16), length=32, iterations=3,
        lanes=4, memory_cost=65536,
    ).derive_phc_encoded(value)


def verify_password(password: str, stored_hash: str) -> bool:
    value = password_bytes(password)
    if not isinstance(stored_hash, str):
        raise InvalidPasswordCredential("Hash de senha inválido.")
    try:
        Argon2id.verify_phc_encoded(value, stored_hash)
    except InvalidKey:
        return False
    return True


class EnvironmentPasswordKeys:
    """Keys supplied by the deployment's secret mechanism; never generated here."""

    def active_id(self) -> str:
        key_id = os.getenv("CLIENT_PASSWORD_ACTIVE_KEY_ID")
        if not key_id:
            raise PasswordKeyConfigurationError("Chave ativa de senha não configurada.")
        return key_id

    def load(self, key_id: str) -> bytes:
        try:
            keys = json.loads(os.environ["CLIENT_PASSWORD_KEYS_JSON"])
            if not isinstance(keys, dict) or not isinstance(keys.get(key_id), str):
                raise ValueError
            key = base64.b64decode(keys[key_id], validate=True)
            if len(key) != 32:
                raise ValueError
            return key
        except (KeyError, ValueError, TypeError, binascii.Error):
            raise PasswordKeyConfigurationError(
                "Chave AES-256 de senha ausente ou inválida na configuração secreta."
            ) from None


def encrypt_password(password: str, client_id: str, version: str, keys=None) -> dict:
    value = password_bytes(password)
    keys = keys if keys is not None else EnvironmentPasswordKeys()
    return encrypt_secret(value, ["client-password", 1, client_id, version], keys)


def decrypt_password(encrypted: dict, client_id: str, version: str, keys=None) -> str:
    keys = keys if keys is not None else EnvironmentPasswordKeys()
    try:
        return decrypt_secret(encrypted, ["client-password", 1, client_id, version], keys).decode("utf-8")
    except (InvalidEncryptedSecret, UnicodeDecodeError):
        raise InvalidPasswordCredential("Falha na autenticação da cifra de senha.") from None
