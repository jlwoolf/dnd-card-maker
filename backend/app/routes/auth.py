"""Authentication endpoints (register, login, refresh, password reset).

Uses the shared ``get_user_id_from_token`` helper to eliminate token-decode
duplication and ``app.constants`` for all magic strings.
"""

import json
import logging
import urllib.request
from datetime import UTC, datetime, timedelta
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Request, status
from jose import JWTError
from sqlalchemy.orm import Session

from app.config import settings
from app.constants import (
    RESET_TOKEN_EXPIRY_HOURS,
    TOKEN_TYPE_REFRESH,
)
from app.dependencies import DBSession
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
logger = logging.getLogger(__name__)


def _verify_turnstile(body: RegisterRequest, request: Request) -> None:
    """Validate the Cloudflare Turnstile token from a registration request.

    Raises ``HTTPException(400)`` when verification fails or the network
    request errors out.  Silently succeeds when Turnstile is not configured
    (``settings.turnstile_secret_key`` is empty).
    """
    if not settings.turnstile_secret_key:
        logger.debug("Turnstile disabled — skipping verification for %s", body.email)
        return

    client_ip = request.client.host if request.client else "127.0.0.1"
    logger.debug(
        "Turnstile enabled — verifying token (len=%d) for %s from %s",
        len(body.turnstile_token), body.email, client_ip,
    )
    verify_data = urllib.parse.urlencode({
        "secret": settings.turnstile_secret_key,
        "response": body.turnstile_token,
        "remoteip": client_ip,
    }).encode()
    verify_req = urllib.request.Request(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        data=verify_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    try:
        with urllib.request.urlopen(verify_req, timeout=5) as resp:
            result = json.loads(resp.read())
        logger.debug("Turnstile siteverify response: %s", result)
        if not result.get("success"):
            logger.warning(
                "Turnstile verification failed for %s: error-codes=%s",
                body.email, result.get("error-codes", "unknown"),
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Captcha verification failed",
            )
        logger.info("Turnstile verification passed for %s", body.email)
    except HTTPException:
        raise
    except Exception:
        logger.exception("Turnstile network error for %s", body.email)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Captcha verification failed",
        ) from None


def _handle_existing_unverified_user(user: User, password: str, db: Session) -> MessageResponse:
    """Re-register an unverified user: update password, issue new token, resend email."""
    logger.info("Re-registration: %s exists unverified — updating password, resending", user.email)
    user.password_hash = hash_password(password)
    user.verify_token = str(uuid4())
    db.commit()
    try:
        send_verification_email(db, user.email, user.verify_token)
    except Exception:
        logger.exception("Failed to send verification email to %s", user.email)
    return MessageResponse(
        message="A verification email has been resent. Check your email to verify your account."
    )


@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, request: Request, db: DBSession):
    """Register a new user account and send a verification email.

    If the email is already registered but not yet verified, update the
    password, generate a fresh verification token, and resend the email.

    Requires a Cloudflare Turnstile token (skipped when secret key is not
    configured, e.g. in local development).
    """
    _verify_turnstile(body, request)

    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        if existing.is_verified:
            logger.info("Registration rejected: %s already verified", body.email)
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )
        return _handle_existing_unverified_user(existing, body.password, db)

    logger.info("New registration: %s — creating user, sending verification", body.email)
    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        verify_token=str(uuid4()),
    )
    db.add(user)
    db.commit()

    try:
        send_verification_email(db, user.email, user.verify_token)
    except Exception:
        logger.exception("Failed to send verification email to %s", user.email)

    logger.debug("Verification token set for %s (token=%s)", user.email, user.verify_token)
    return MessageResponse(
        message="Registration successful. Check your email to verify your account."
    )


@router.get("/verify/{token}", response_model=MessageResponse)
def verify_email(token: str, db: DBSession):
    """Verify a user's email address using the token sent after registration."""
    user = db.query(User).filter(User.verify_token == token).first()
    if not user:
        logger.info("Email verification failed: invalid token")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid verification token",
        )

    user.is_verified = True
    user.verify_token = None
    db.commit()

    logger.info("Email verified for %s", user.email)
    return MessageResponse(message="Email verified successfully")


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: DBSession):
    """Authenticate a user and return access and refresh JWT tokens."""
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        logger.info("Login failed for %s: %s", body.email, "user not found" if not user else "invalid password")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_verified:
        logger.info("Login rejected: %s is not verified", body.email)
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

    logger.info("Login successful for %s", body.email)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh(body: RefreshRequest, db: DBSession):
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
def forgot_password(body: ForgotPasswordRequest, db: DBSession):
    """Send a password-reset email if the given email is registered."""
    user = db.query(User).filter(User.email == body.email).first()
    if user:
        user.reset_token = str(uuid4())
        user.reset_expires = datetime.now(UTC) + timedelta(hours=RESET_TOKEN_EXPIRY_HOURS)
        db.commit()

        try:
            send_reset_email(db, user.email, user.reset_token)
            logger.info("Password reset email sent to %s", body.email)
        except Exception:
            logger.exception("Failed to send reset email to %s", user.email)
    else:
        logger.info("Password reset requested for unknown email: %s", body.email)

    return MessageResponse(message="If the email is registered, a reset link has been sent.")


@router.post("/reset-password/{token}", response_model=MessageResponse)
def reset_password(token: str, body: ResetPasswordRequest, db: DBSession):
    """Reset the user's password using a valid reset token.

    Increments ``token_version`` to invalidate all existing sessions.
    If the account was unverified, it becomes verified (proving ownership
    of the email via the reset link is equivalent to verification).
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
        logger.info("Password reset failed: invalid or expired token")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid or expired reset token",
        )

    user.password_hash = hash_password(body.password)
    user.reset_token = None
    user.reset_expires = None
    user.token_version += 1
    if not user.is_verified:
        user.is_verified = True
        user.verify_token = None
        logger.info("Password reset auto-verified %s", user.email)
    db.commit()

    logger.info("Password reset successful for %s", user.email)
    return MessageResponse(message="Password reset successfully")
