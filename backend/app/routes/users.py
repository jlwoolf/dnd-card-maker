"""User management endpoints (change password, update email, delete account)."""

import logging
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.card import Card
from app.models.deck import Deck
from app.models.user import User
from app.schemas import (
    ChangePasswordRequest,
    DeleteAccountRequest,
    MessageResponse,
    UpdateEmailRequest,
)
from app.services import (
    hash_password,
    verify_password,
)
from app.services.email import send_verification_email

router = APIRouter(prefix="/api/users/me", tags=["users"])


@router.post("/change-password", response_model=MessageResponse)
def change_password(
    body: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(body.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    user.password_hash = hash_password(body.new_password)
    user.token_version += 1
    db.commit()

    return MessageResponse(
        message="Password changed successfully. Please log in again with your new password."
    )


@router.put("/email", response_model=MessageResponse)
def update_email(
    body: UpdateEmailRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is incorrect",
        )

    if db.query(User).filter(User.email == body.new_email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already in use",
        )

    user.email = body.new_email
    user.is_verified = False
    user.verify_token = str(uuid4())
    db.commit()

    try:
        send_verification_email(user.email, user.verify_token)
    except Exception:
        logging.getLogger(__name__).exception(
            "Failed to send verification email to %s", user.email
        )

    return MessageResponse(
        message="Email updated. Please check your new email address for a verification link."
    )


@router.delete("", response_model=MessageResponse)
def delete_account(
    body: DeleteAccountRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is incorrect",
        )

    db.query(Card).filter(Card.user_id == user.id).delete()
    db.query(Deck).filter(Deck.user_id == user.id).delete()
    db.delete(user)
    db.commit()

    return MessageResponse(message="Account deleted successfully")
