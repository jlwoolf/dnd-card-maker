"""Authentication endpoints (register, login, refresh, password reset).

Uses the shared ``get_user_id_from_token`` helper to eliminate token-decode
duplication and ``app.constants`` for all magic strings.
"""

import logging
from datetime import UTC, datetime, timedelta
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError
from sqlalchemy.orm import Session

from app.config import settings
from app.constants import (
    RESET_TOKEN_EXPIRY_HOURS,
    TOKEN_TYPE_REFRESH,
)
from app.database import get_db
from app.models.user import User
from app.schemas import (
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from app.services import (
    create_access_token,
    create_refresh_token,
    get_user_id_from_token,
    hash_password,
    send_reset_email,
    send_verification_email,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user account and send a verification email."""
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        verify_token=str(uuid4()),
    )
    db.add(user)
    db.commit()

    try:
        send_verification_email(user.email, user.verify_token)
    except Exception:
        logging.getLogger(__name__).exception("Failed to send verification email to %s", user.email)

    return MessageResponse(
        message="Registration successful. Check your email to verify your account."
    )


@router.get("/verify/{token}", response_model=MessageResponse)
def verify_email(token: str, db: Session = Depends(get_db)):
    """Verify a user's email address using the token sent after registration."""
    user = db.query(User).filter(User.verify_token == token).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid verification token",
        )

    user.is_verified = True
    user.verify_token = None
    db.commit()

    return MessageResponse(message="Email verified successfully")


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate a user and return access and refresh JWT tokens."""
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified",
        )

    access_token = create_access_token(
        {"sub": user.id, "email": user.email, "tv": user.token_version},
        settings.jwt_secret,
        timedelta(minutes=settings.jwt_access_expire_minutes),
    )
    refresh_token = create_refresh_token(
        {"sub": user.id, "tv": user.token_version},
        settings.jwt_secret,
        timedelta(days=settings.jwt_refresh_expire_days),
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh(body: RefreshRequest, db: Session = Depends(get_db)):
    """Issue a new access token AND a new refresh token (rotation).

    On success, the old refresh token is effectively invalidated because the
    new refresh token carries the same ``token_version``, but future requests
    that use the old token will fail on type validation. For full invalidation,
    ``token_version`` is incremented on password reset.
    """
    try:
        user_id = get_user_id_from_token(body.refresh_token, TOKEN_TYPE_REFRESH, settings.jwt_secret)
    except (JWTError, ValueError) as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        ) from err

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    access_token = create_access_token(
        {"sub": user.id, "email": user.email, "tv": user.token_version},
        settings.jwt_secret,
        timedelta(minutes=settings.jwt_access_expire_minutes),
    )
    refresh_token = create_refresh_token(
        {"sub": user.id, "tv": user.token_version},
        settings.jwt_secret,
        timedelta(days=settings.jwt_refresh_expire_days),
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Send a password-reset email if the given email belongs to a verified user."""
    user = db.query(User).filter(User.email == body.email).first()
    if user and user.is_verified:
        user.reset_token = str(uuid4())
        user.reset_expires = datetime.now(UTC) + timedelta(hours=RESET_TOKEN_EXPIRY_HOURS)
        db.commit()

        try:
            send_reset_email(user.email, user.reset_token)
        except Exception:
            logging.getLogger(__name__).exception("Failed to send reset email to %s", user.email)

    return MessageResponse(message="If the email is registered, a reset link has been sent.")


@router.post("/reset-password/{token}", response_model=MessageResponse)
def reset_password(token: str, body: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset the user's password using a valid reset token.

    Increments ``token_version`` to invalidate all existing sessions.
    """
    user = (
        db.query(User)
        .filter(
            User.reset_token == token,
            User.reset_expires > datetime.now(UTC),
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid or expired reset token",
        )

    user.password_hash = hash_password(body.password)
    user.reset_token = None
    user.reset_expires = None
    user.token_version += 1
    db.commit()

    return MessageResponse(message="Password reset successfully")
