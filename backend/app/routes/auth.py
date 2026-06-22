from datetime import datetime, timedelta, timezone
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


@router.post("/register", response_model=MessageResponse)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
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
        pass

    return MessageResponse(message="Registration successful. Check your email to verify your account.")


@router.get("/verify/{token}", response_model=MessageResponse)
def verify_email(token: str, db: Session = Depends(get_db)):
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
        {"sub": user.id, "email": user.email},
        settings.jwt_secret,
        timedelta(minutes=settings.jwt_access_expire_minutes),
    )
    refresh_token = create_refresh_token(
        {"sub": user.id},
        settings.jwt_secret,
        timedelta(days=settings.jwt_refresh_expire_days),
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh(body: RefreshRequest, db: Session = Depends(get_db)):
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
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    access_token = create_access_token(
        {"sub": user.id, "email": user.email},
        settings.jwt_secret,
        timedelta(minutes=settings.jwt_access_expire_minutes),
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=body.refresh_token,
    )


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if user and user.is_verified:
        user.reset_token = str(uuid4())
        user.reset_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        db.commit()

        try:
            send_reset_email(user.email, user.reset_token)
        except Exception:
            pass

    return MessageResponse(
        message="If the email is registered, a reset link has been sent."
    )


@router.post("/reset-password/{token}", response_model=MessageResponse)
def reset_password(token: str, body: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        User.reset_token == token,
        User.reset_expires > datetime.now(timezone.utc),
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid or expired reset token",
        )

    user.password_hash = hash_password(body.password)
    user.reset_token = None
    user.reset_expires = None
    db.commit()

    return MessageResponse(message="Password reset successfully")
