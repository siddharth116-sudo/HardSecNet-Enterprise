"""Symmetric encryption for secrets at rest (e.g. remote-node WinRM passwords).

Node credentials must be usable at runtime (to authenticate WinRM), so they cannot
be one-way hashed like user passwords. Instead they are encrypted at rest with a
Fernet key derived from NODE_SECRET_KEY (or JWT_SECRET_KEY as a fallback).

decrypt_secret tolerates legacy plaintext values (rows written before encryption
was added) so existing nodes keep working; re-saving a node upgrades it to ciphertext.
"""
from __future__ import annotations

import base64
import hashlib
import os

from cryptography.fernet import Fernet, InvalidToken

_PREFIX = "enc:v1:"


def _fernet() -> Fernet:
    secret = os.getenv("NODE_SECRET_KEY") or os.getenv("JWT_SECRET_KEY")
    if not secret:
        raise RuntimeError(
            "NODE_SECRET_KEY or JWT_SECRET_KEY must be set to encrypt node credentials."
        )
    # Derive a stable 32-byte urlsafe-base64 Fernet key from the configured secret.
    key = base64.urlsafe_b64encode(hashlib.sha256(secret.encode("utf-8")).digest())
    return Fernet(key)


def encrypt_secret(plaintext: str | None) -> str | None:
    if plaintext is None:
        return None
    token = _fernet().encrypt(plaintext.encode("utf-8")).decode("utf-8")
    return _PREFIX + token


def decrypt_secret(value: str | None) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str) or not value.startswith(_PREFIX):
        return value  # legacy plaintext written before encryption was introduced
    token = value[len(_PREFIX):]
    try:
        return _fernet().decrypt(token.encode("utf-8")).decode("utf-8")
    except InvalidToken:
        return None
