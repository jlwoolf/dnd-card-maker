from datetime import UTC, datetime, timedelta

import bcrypt
from jose import JWTError, jwt

from app.constants import JWT_ALGORITHM, TOKEN_TYPE_ACCESS, TOKEN_TYPE_REFRESH


def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt.

    Passwords longer than 72 bytes are truncated to bcrypt's maximum input length.
    """
    password_bytes = password.encode("utf-8")
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    return bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    password_bytes = plain_password.encode("utf-8")
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    return bcrypt.checkpw(password_bytes, hashed_password.encode("utf-8"))


def create_access_token(data: dict, secret: str, expires_delta: timedelta) -> str:
    """Create a short-lived JWT access token for API authentication."""
    to_encode = data.copy()
    expire = datetime.now(UTC) + expires_delta
    to_encode.update({"exp": expire, "type": TOKEN_TYPE_ACCESS})
    return jwt.encode(to_encode, secret, algorithm=JWT_ALGORITHM)


def create_refresh_token(data: dict, secret: str, expires_delta: timedelta) -> str:
    """Create a long-lived JWT refresh token for obtaining new access tokens."""
    to_encode = data.copy()
    expire = datetime.now(UTC) + expires_delta
    to_encode.update({"exp": expire, "type": TOKEN_TYPE_REFRESH})
    return jwt.encode(to_encode, secret, algorithm=JWT_ALGORITHM)


def decode_token(token: str, secret: str) -> dict:
    """Decode and validate a JWT token, returning its payload."""
    return jwt.decode(token, secret, algorithms=[JWT_ALGORITHM])


def get_user_id_from_token(token: str, expected_type: str, secret: str) -> str:
    """Decode a JWT token and validate its type, returning the ``sub`` claim.

    This single helper replaces the token-decode-and-validate pattern that was
    duplicated across ``dependencies.py`` and ``routes/auth.py``.

    Raises ``JWTError`` for invalid/expired tokens and ``ValueError`` when the
    token type does not match ``expected_type`` or the ``sub`` claim is missing.
    """
    payload = decode_token(token, secret)
    if payload.get("type") != expected_type:
        raise ValueError(f"Expected token type '{expected_type}', got '{payload.get('type')}'")
    user_id: str | None = payload.get("sub")
    if user_id is None:
        raise ValueError("Token missing 'sub' claim")
    return user_id
