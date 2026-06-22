from datetime import UTC, datetime, timedelta

import bcrypt
from jose import jwt


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
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, secret, algorithm="HS256")


def create_refresh_token(data: dict, secret: str, expires_delta: timedelta) -> str:
    """Create a long-lived JWT refresh token for obtaining new access tokens."""
    to_encode = data.copy()
    expire = datetime.now(UTC) + expires_delta
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, secret, algorithm="HS256")


def decode_token(token: str, secret: str) -> dict:
    """Decode and validate a JWT token, returning its payload."""
    return jwt.decode(token, secret, algorithms=["HS256"])
