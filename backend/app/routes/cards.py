import json
import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.card import Card
from app.models.user import User
from app.schemas import (
    CardCreate,
    CardResponse,
    CardSummary,
    CardThemeSchema,
    CardUpdate,
    MessageResponse,
    ShareToggle,
)

router = APIRouter(prefix="/api/cards", tags=["cards"])


def card_to_response(card: Card) -> CardResponse:
    return CardResponse(
        id=card.id,
        user_id=card.user_id,
        title=card.title,
        elements=json.loads(card.elements),
        img_url=card.img_url,
        theme=CardThemeSchema(**json.loads(card.theme)),
        share_slug=card.share_slug,
        share_mode=card.share_mode,
        share_at=card.share_at,
        created_at=card.created_at,
        updated_at=card.updated_at,
    )


@router.get("", response_model=list[CardSummary])
def list_cards(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cards = (
        db.query(Card)
        .filter(Card.user_id == current_user.id)
        .order_by(Card.updated_at.desc())
        .all()
    )
    return [
        CardSummary(
            id=c.id,
            title=c.title,
            created_at=c.created_at,
            updated_at=c.updated_at,
            share_slug=c.share_slug,
            share_mode=c.share_mode,
        )
        for c in cards
    ]


@router.post("", response_model=CardResponse, status_code=status.HTTP_201_CREATED)
def create_card(
    body: CardCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    card = Card(
        user_id=current_user.id,
        title=body.title,
        elements=json.dumps(body.elements),
        img_url=body.img_url,
        theme=json.dumps(body.theme.model_dump()),
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    return card_to_response(card)


@router.get("/{card_id}", response_model=CardResponse)
def get_card(
    card_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    card = (
        db.query(Card)
        .filter(Card.id == card_id, Card.user_id == current_user.id)
        .first()
    )
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")
    return card_to_response(card)


@router.put("/{card_id}", response_model=CardResponse)
def update_card(
    card_id: str,
    body: CardUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    card = (
        db.query(Card)
        .filter(Card.id == card_id, Card.user_id == current_user.id)
        .first()
    )
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")

    if body.title is not None:
        card.title = body.title
    if body.elements is not None:
        card.elements = json.dumps(body.elements)
    if body.img_url is not None:
        card.img_url = body.img_url
    if body.theme is not None:
        card.theme = json.dumps(body.theme.model_dump())

    db.commit()
    db.refresh(card)
    return card_to_response(card)


@router.delete("/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_card(
    card_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    card = (
        db.query(Card)
        .filter(Card.id == card_id, Card.user_id == current_user.id)
        .first()
    )
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")

    db.delete(card)
    db.commit()


@router.post("/{card_id}/share", response_model=CardResponse)
def share_card(
    card_id: str,
    body: ShareToggle,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.mode not in ("view_only", "view_and_copy"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mode must be 'view_only' or 'view_and_copy'",
        )

    card = (
        db.query(Card)
        .filter(Card.id == card_id, Card.user_id == current_user.id)
        .first()
    )
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")

    from datetime import datetime, timezone

    card.share_slug = secrets.token_urlsafe(6)[:8]
    card.share_mode = body.mode
    card.share_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(card)
    return card_to_response(card)


@router.delete("/{card_id}/share", status_code=status.HTTP_204_NO_CONTENT)
def unshare_card(
    card_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    card = (
        db.query(Card)
        .filter(Card.id == card_id, Card.user_id == current_user.id)
        .first()
    )
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")

    card.share_slug = None
    card.share_mode = None
    card.share_at = None

    db.commit()
