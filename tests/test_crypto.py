import os

os.environ.setdefault("NODE_SECRET_KEY", "unit-test-secret-key")

from crypto_util import encrypt_secret, decrypt_secret


def test_roundtrip():
    ct = encrypt_secret("S3cret-WinRM-pass!")
    assert ct.startswith("enc:v1:")
    assert decrypt_secret(ct) == "S3cret-WinRM-pass!"


def test_ciphertext_is_not_plaintext():
    assert encrypt_secret("hunter2") != "hunter2"


def test_legacy_plaintext_passthrough():
    # rows written before encryption was added must still decrypt to themselves
    assert decrypt_secret("oldPlainPassword") == "oldPlainPassword"


def test_none_is_safe():
    assert encrypt_secret(None) is None
    assert decrypt_secret(None) is None
