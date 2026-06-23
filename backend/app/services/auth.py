from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING

import bcrypt
from fastapi import HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.constants import JWT_ALGORITHM, TOKEN_TYPE_ACCESS, TOKEN_TYPE_REFRESH

if TYPE_CHECKING:
    from app.models.user import User


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


def validate_token_and_get_user(
    token: str,
    expected_type: str,
    secret: str,
    db: Session,
) -> User | None:
    """Decode a JWT, look up the user, and run ownership/verification checks.

    Returns ``None`` when the token cannot be decoded — the caller decides
    whether to fall through to public access (images endpoint) or return 401.

    Raises ``HTTPException`` (401/403) when the token is valid but the user
    is missing, the token version is stale, or the email is unverified.
    """
    try:
        user_id = get_user_id_from_token(token, expected_type, secret)
        payload = decode_token(token, secret)
    except (JWTError, ValueError):
        return None

    # Inline import avoids circular dependency at module level
    from app.models.user import User  # noqa: PLC0415

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    token_version = payload.get("tv")
    if token_version is not None and user.token_version != token_version:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token version mismatch - please re-login",
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified",
        )
    return user
