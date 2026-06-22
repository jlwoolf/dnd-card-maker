from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.config import settings
from app.constants import TOKEN_TYPE_ACCESS
from app.database import get_db
from app.models.user import User
from app.services.auth import decode_token, get_user_id_from_token

security_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> User:
    """FastAPI dependency that extracts and validates the current user from a Bearer token.

    Decodes the JWT access token, verifies its type and token version, and
    ensures the user exists and is verified. Returns the ``User`` model on
    success. Raises 401 for invalid/missing/expired tokens or version
    mismatches, and 403 if the email is not verified.
    """
    token = credentials.credentials
    try:
        user_id = get_user_id_from_token(token, TOKEN_TYPE_ACCESS, settings.jwt_secret)
        payload = decode_token(token, settings.jwt_secret)
    except (JWTError, ValueError) as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        ) from err

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
