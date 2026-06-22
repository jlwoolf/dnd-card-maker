import logging
from datetime import UTC, datetime, timedelta
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError
from sqlalchemy.orm import Session

from app.config import settings
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
    decode_token,
    hash_password,
    send_reset_email,
    send_verification_email,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user account and send a verification email.

    Returns 201 with a success message. Returns 409 if the email is already
    registered. Rate limiting applies via the global limiter.
    """
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
    """Verify a user's email address using the token sent after registration.

    The ``token`` path parameter is the verification token from the email link.
    Returns 200 on success. Returns 404 for an invalid or already-used token.
    """
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
    """Authenticate a user and return access and refresh JWT tokens.

    The ``body.email`` and ``body.password`` fields are used for authentication.
    Returns 200 with token pair on success. Returns 401 for invalid credentials
    and 403 if the email has not been verified. Rate limiting applies.
    """
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
    """Issue a new access token using a valid refresh token.

    The ``body.refresh_token`` must be a valid, non-expired refresh token.
    Returns 200 with a new access token (the refresh token itself is not rotated).
    Returns 401 for invalid, expired, or wrong-type tokens. Rate limiting applies.
    """
    try:
        payload = decode_token(body.refresh_token, settings.jwt_secret)
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )
    except JWTError as err:
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

    return TokenResponse(
        access_token=access_token,
        refresh_token=body.refresh_token,
    )


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Send a password-reset email if the given email belongs to a verified user.

    Always returns 200 with a generic success message to avoid leaking
    whether an email is registered. Rate limiting applies.
    """
    user = db.query(User).filter(User.email == body.email).first()
    if user and user.is_verified:
        user.reset_token = str(uuid4())
        user.reset_expires = datetime.now(UTC) + timedelta(hours=1)
        db.commit()

        try:
            send_reset_email(user.email, user.reset_token)
        except Exception:
            logging.getLogger(__name__).exception("Failed to send reset email to %s", user.email)

    return MessageResponse(message="If the email is registered, a reset link has been sent.")


@router.post("/reset-password/{token}", response_model=MessageResponse)
def reset_password(token: str, body: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset the user's password using a valid reset token.

    The ``token`` path parameter comes from the forgot-password email link.
    ``body.password`` is the new password. Returns 200 on success or 404 if
    the token is invalid or expired. Invalidates all existing sessions by
    incrementing the token version. Rate limiting applies.
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
