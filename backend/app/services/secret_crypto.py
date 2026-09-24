"""Shared AES-GCM encoding. Callers supply a purpose-specific context/keyring."""
import base64
import binascii
import json
import os

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


class InvalidEncryptedSecret(ValueError):
    pass


def _aad(context, key_id):
    return json.dumps([*context, key_id, "AES-256-GCM"],
                      ensure_ascii=True, separators=(",", ":")).encode("utf-8")


def encrypt_secret(value: bytes, context: list, keys) -> dict:
    key_id = keys.active_id()
    key = keys.load(key_id)
    nonce = os.urandom(12)
    ciphertext = AESGCM(key).encrypt(nonce, value, _aad(context, key_id))
    return {"algorithm": "AES-256-GCM", "formatVersion": 1, "keyId": key_id,
            "nonce": base64.b64encode(nonce).decode("ascii"),
            "ciphertext": base64.b64encode(ciphertext).decode("ascii")}


def decrypt_secret(encrypted: dict, context: list, keys) -> bytes:
    try:
        if encrypted["algorithm"] != "AES-256-GCM" or encrypted["formatVersion"] != 1:
            raise ValueError
        key_id = encrypted["keyId"]
        if not isinstance(key_id, str) or not key_id:
            raise ValueError
        nonce = base64.b64decode(encrypted["nonce"], validate=True)
        ciphertext = base64.b64decode(encrypted["ciphertext"], validate=True)
        if len(nonce) != 12:
            raise ValueError
    except (KeyError, ValueError, TypeError, binascii.Error):
        raise InvalidEncryptedSecret("Formato de cifra inválido.") from None
    key = keys.load(key_id)
    try:
        return AESGCM(key).decrypt(nonce, ciphertext, _aad(context, key_id))
    except InvalidTag:
        raise InvalidEncryptedSecret("Falha na autenticação da cifra.") from None
