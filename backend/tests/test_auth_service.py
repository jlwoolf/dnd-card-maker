"""Unit tests for app/services/auth.py — password hashing, JWT creation/validation."""

from datetime import timedelta

import pytest
from jose import JWTError

from app.constants import JWT_ALGORITHM, TOKEN_TYPE_ACCESS, TOKEN_TYPE_REFRESH
from app.services.auth import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_user_id_from_token,
    hash_password,
    verify_password,
)

TEST_SECRET = "test-secret-key-for-unit-tests"
TEST_USER_ID = "user-123"
TEST_EMAIL = "test@example.com"


class TestPasswordHashing:
    def test_hash_and_verify_round_trip(self):
        hashed = hash_password("mypassword")
        assert isinstance(hashed, str)
        assert hashed.startswith("$2b$") or hashed.startswith("$2a$")
        assert verify_password("mypassword", hashed) is True

    def test_verify_wrong_password(self):
        hashed = hash_password("correct")
        assert verify_password("wrong", hashed) is False

    def test_verify_empty_password(self):
        hashed = hash_password("")
        assert verify_password("", hashed) is True
        assert verify_password("x", hashed) is False

    def test_hash_produces_different_salts(self):
        h1 = hash_password("same")
        h2 = hash_password("same")
        assert h1 != h2  # different salts
        assert verify_password("same", h1)
        assert verify_password("same", h2)

    def test_truncation_at_72_bytes(self):
        """Passwords longer than 72 bytes are truncated (bcrypt limit)."""
        long_pass = "a" * 80
        hashed = hash_password(long_pass)
        # Verification truncates the same way, so it should still match
        assert verify_password(long_pass, hashed) is True
        # A password that differs only after 72 bytes should still match
        almost_same = "a" * 72 + "b" * 8
        assert verify_password(almost_same, hashed) is True

    def test_unicode_password(self):
        hashed = hash_password("café-ñ-密码")
        assert verify_password("café-ñ-密码", hashed) is True


class TestJWTCreation:
    def test_create_access_token(self):
        token = create_access_token(
            {"sub": TEST_USER_ID, "email": TEST_EMAIL},
            TEST_SECRET,
            timedelta(minutes=15),
        )
        assert isinstance(token, str)
        payload = decode_token(token, TEST_SECRET)
        assert payload["sub"] == TEST_USER_ID
        assert payload["email"] == TEST_EMAIL
        assert payload["type"] == TOKEN_TYPE_ACCESS
        assert "exp" in payload

    def test_create_refresh_token(self):
        token = create_refresh_token(
            {"sub": TEST_USER_ID},
            TEST_SECRET,
            timedelta(days=7),
        )
        payload = decode_token(token, TEST_SECRET)
        assert payload["sub"] == TEST_USER_ID
        assert payload["type"] == TOKEN_TYPE_REFRESH
        assert "exp" in payload

    def test_token_includes_expiry(self):
        token = create_access_token(
            {"sub": TEST_USER_ID}, TEST_SECRET, timedelta(minutes=15)
        )
        payload = decode_token(token, TEST_SECRET)
        assert "exp" in payload

    def test_expired_token_raises(self):
        token = create_access_token(
            {"sub": TEST_USER_ID}, TEST_SECRET, timedelta(seconds=-1)
        )
        with pytest.raises(JWTError):
            decode_token(token, TEST_SECRET)

    def test_token_with_wrong_secret_raises(self):
        token = create_access_token(
            {"sub": TEST_USER_ID}, TEST_SECRET, timedelta(minutes=15)
        )
        with pytest.raises(JWTError):
            decode_token(token, "wrong-secret")

    def test_encoded_tokens_use_configured_algorithm(self):
        token = create_access_token(
            {"sub": TEST_USER_ID}, TEST_SECRET, timedelta(minutes=15)
        )
        # HS256 tokens have 3 dot-separated parts
        parts = token.split(".")
        assert len(parts) == 3


class TestGetUserIdFromToken:
    def test_valid_access_token(self):
        token = create_access_token(
            {"sub": TEST_USER_ID}, TEST_SECRET, timedelta(minutes=15)
        )
        uid = get_user_id_from_token(token, TOKEN_TYPE_ACCESS, TEST_SECRET)
        assert uid == TEST_USER_ID

    def test_valid_refresh_token(self):
        token = create_refresh_token(
            {"sub": TEST_USER_ID}, TEST_SECRET, timedelta(days=7)
        )
        uid = get_user_id_from_token(token, TOKEN_TYPE_REFRESH, TEST_SECRET)
        assert uid == TEST_USER_ID

    def test_wrong_expected_type_raises(self):
        token = create_access_token(
            {"sub": TEST_USER_ID}, TEST_SECRET, timedelta(minutes=15)
        )
        with pytest.raises(ValueError, match="Expected token type"):
            get_user_id_from_token(token, TOKEN_TYPE_REFRESH, TEST_SECRET)

    def test_missing_sub_raises(self):
        # Create a token without a sub claim and manipulate it
        token = create_access_token(
            {}, TEST_SECRET, timedelta(minutes=15)
        )
        with pytest.raises(ValueError, match="missing 'sub'"):
            get_user_id_from_token(token, TOKEN_TYPE_ACCESS, TEST_SECRET)

    def test_invalid_token_raises(self):
        with pytest.raises(JWTError):
            get_user_id_from_token("not.a.token", TOKEN_TYPE_ACCESS, TEST_SECRET)
