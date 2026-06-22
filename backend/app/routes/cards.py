import json
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.card import Card
from app.models.deck import Deck, DeckCard
from app.models.user import User
from app.schemas import (
    CardCreate,
    CardDecksResponse,
    CardDecksUpdate,
    CardResponse,
    CardSummary,
    CardThemeSchema,
    CardUpdate,
    MessageResponse,
    ShareToggle,
)

router = APIRouter(prefix="/api/cards", tags=["cards"])


def _get_or_create_default_deck(user_id: str, db: Session) -> Deck:
    deck = db.query(Deck).filter(Deck.user_id == user_id, Deck.is_default == True).first()
    if not deck:
        deck = Deck(user_id=user_id, title="My Cards", is_default=True)
        db.add(deck)
        db.commit()
        db.refresh(deck)
    return deck


def _cleanup_orphaned_card(card_id: str, db: Session) -> None:
    count = db.query(DeckCard).filter(DeckCard.card_id == card_id).count()
    if count == 0:
        db.query(Card).filter(Card.id == card_id).delete()


@router.post("/{card_id}/toggle-save", response_model=MessageResponse)
def toggle_save_card(
    card_id: str,
    action: str = Query("toggle", pattern="^(toggle|save|unsave)$"),
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

    default_deck = _get_or_create_default_deck(current_user.id, db)
    existing = db.query(DeckCard).filter(
        DeckCard.deck_id == default_deck.id, DeckCard.card_id == card_id
    ).first()

    if action == "save":
        if not existing:
            max_pos = (
                db.query(DeckCard.position)
                .filter(DeckCard.deck_id == default_deck.id)
                .order_by(DeckCard.position.desc())
                .first()
            )
            next_pos = (max_pos[0] + 1) if max_pos else 0
            db.add(DeckCard(deck_id=default_deck.id, card_id=card_id, position=next_pos))
            db.commit()
        return MessageResponse(message="saved")

    if action == "unsave":
        if existing:
            db.delete(existing)
            db.commit()
            _cleanup_orphaned_card(card_id, db)
            db.commit()
        return MessageResponse(message="unsaved")

    if existing:
        db.delete(existing)
        db.commit()
        _cleanup_orphaned_card(card_id, db)
        db.commit()
        return MessageResponse(message="unsaved")
    else:
        max_pos = (
            db.query(DeckCard.position)
            .filter(DeckCard.deck_id == default_deck.id)
            .order_by(DeckCard.position.desc())
            .first()
        )
        next_pos = (max_pos[0] + 1) if max_pos else 0
        db.add(DeckCard(deck_id=default_deck.id, card_id=card_id, position=next_pos))
        db.commit()
        return MessageResponse(message="saved")


@router.get("/{card_id}/decks", response_model=list[CardDecksResponse])
def get_card_decks(
    card_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    deck_cards = (
        db.query(Deck)
        .join(DeckCard, DeckCard.deck_id == Deck.id)
        .filter(DeckCard.card_id == card_id, Deck.user_id == current_user.id)
        .all()
    )
    return [
        CardDecksResponse(deck_id=d.id, title=d.title, is_default=d.is_default)
        for d in deck_cards
    ]


@router.put("/{card_id}/decks", status_code=status.HTTP_204_NO_CONTENT)
def update_card_decks(
    card_id: str,
    body: CardDecksUpdate,
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

    db.query(DeckCard).filter(
        DeckCard.card_id == card_id,
        DeckCard.deck_id.in_(
            db.query(Deck.id).filter(Deck.user_id == current_user.id)
        ),
    ).delete(synchronize_session=False)

    for i, deck_id in enumerate(body.deck_ids):
        db.add(DeckCard(deck_id=deck_id, card_id=card_id, position=i))

    db.commit()
    _cleanup_orphaned_card(card_id, db)
    db.commit()


def _get_default_deck_card_ids(user_id: str, db: Session) -> set[str]:
    deck = db.query(Deck).filter(Deck.user_id == user_id, Deck.is_default == True).first()
    if not deck:
        return set()
    return {dc.card_id for dc in deck.deck_cards}


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
    deck_cards = (
        db.query(Card)
        .join(DeckCard, DeckCard.card_id == Card.id)
        .join(Deck, Deck.id == DeckCard.deck_id)
        .filter(Deck.user_id == current_user.id, Deck.is_default == True)
        .order_by(Card.updated_at.desc())
        .all()
    )
    saved_ids = {c.id for c in deck_cards}
    seen = set()
    result = []
    for c in deck_cards:
        if c.id in seen:
            continue
        seen.add(c.id)
        result.append(
            CardSummary(
                id=c.id,
                title=c.title,
                img_url=c.img_url,
                saved=True,
                created_at=c.created_at,
                updated_at=c.updated_at,
                share_slug=c.share_slug,
                share_mode=c.share_mode,
            )
        )
    return result


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
    db.flush()

    default_deck = _get_or_create_default_deck(current_user.id, db)
    max_pos = (
        db.query(DeckCard.position)
        .filter(DeckCard.deck_id == default_deck.id)
        .order_by(DeckCard.position.desc())
        .first()
    )
    next_pos = (max_pos[0] + 1) if max_pos else 0
    db.add(DeckCard(deck_id=default_deck.id, card_id=card.id, position=next_pos))

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
