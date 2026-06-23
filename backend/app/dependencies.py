from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.config import settings
from app.constants import TOKEN_TYPE_ACCESS
from app.database import get_db
from app.models.user import User
from app.services.auth import validate_token_and_get_user

security_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> User:
    """FastAPI dependency that extracts and validates the current user from a Bearer token.

    Delegates to ``validate_token_and_get_user`` for the shared JWT validation
    logic. Raises 401 when the token is invalid or cannot be decoded, and 401/403
    for token version mismatches or unverified emails.
    """
    user = validate_token_and_get_user(
        credentials.credentials, TOKEN_TYPE_ACCESS, settings.jwt_secret, db
    )
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
    return user


def check_dev_mode(request: Request) -> None:
    """Guard dev/admin routes behind the ``dev_mail_enabled`` flag.

    Returns 404 (as if the routes do not exist) when dev mode is off, and
    requires an ``X-Dev-Auth`` header matching ``JWT_SECRET`` when enabled
    so the routes are never accidentally exposed in production even when
    the flag is misconfigured.
    """
    if not settings.dev_mail_enabled:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    header = request.headers.get("X-Dev-Auth")
    if not header or header != settings.jwt_secret:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)


# Reusable dependency type aliases following the FastAPI ``Annotated`` convention.
DBSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]
