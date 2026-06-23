"""Card business logic extracted from route handlers.

All functions accept a SQLAlchemy ``Session`` and perform database operations.
This separation allows route handlers to remain thin (validate input, call
service, return response) while keeping business logic testable independently.
"""

import json

from sqlalchemy.orm import Session

from app.models.card import Card
from app.models.deck import Deck, DeckCard
from app.schemas.card import CardResponse, CardSummary, CardThemeSchema, SharedCardResponse
from app.services.deck_service import (
    cleanup_orphaned_card,
    get_next_deck_position,
    get_or_create_default_deck,
)
from app.utils.shared import apply_share, remove_share


def card_to_response(card: Card) -> CardResponse:
    """Serialize a Card ORM model into a CardResponse schema."""
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


def card_to_shared_response(card: Card) -> SharedCardResponse:
    """Serialize a Card ORM model into a public SharedCardResponse.

    Omits ownership fields (``user_id``) and computes the ``can_copy``
    flag from the card's share mode.
    """
    from app.constants import SHARE_MODE_VIEW_AND_COPY

    return SharedCardResponse(
        id=card.id,
        title=card.title,
        elements=json.loads(card.elements),
        img_url=card.img_url,
        theme=CardThemeSchema(**json.loads(card.theme)),
        mode=card.share_mode,
        can_copy=card.share_mode == SHARE_MODE_VIEW_AND_COPY,
    )


def list_user_cards(user_id: str, db: Session) -> list[CardSummary]:
    """List cards saved to the user's default deck, ordered by most recently updated."""
    deck_cards = (
        db.query(Card)
        .join(DeckCard, DeckCard.card_id == Card.id)
        .join(Deck, Deck.id == DeckCard.deck_id)
        .filter(Deck.user_id == user_id, Deck.is_default)
        .order_by(Card.updated_at.desc())
        .all()
    )
    seen: set[str] = set()
    result: list[CardSummary] = []
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


def create_card(
    user_id: str,
    title: str | None,
    elements: list[dict],
    img_url: str,
    theme: CardThemeSchema,
    db: Session,
) -> Card:
    """Create a new card and add it to the user's default deck."""
    card = Card(
        user_id=user_id,
        title=title,
        elements=json.dumps(elements),
        img_url=img_url,
        theme=json.dumps(theme.model_dump()),
    )
    db.add(card)
    db.flush()

    default_deck = get_or_create_default_deck(user_id, db)
    next_pos = get_next_deck_position(default_deck.id, db)
    db.add(DeckCard(deck_id=default_deck.id, card_id=card.id, position=next_pos))

    db.commit()
    db.refresh(card)
    return card


def get_card_by_id(card_id: str, user_id: str, db: Session) -> Card | None:
    """Retrieve a single card owned by the given user, or None."""
    return db.query(Card).filter(Card.id == card_id, Card.user_id == user_id).first()


def update_card(
    card: Card,
    title: str | None,
    elements: list[dict] | None,
    img_url: str | None,
    theme: CardThemeSchema | None,
    db: Session,
) -> Card:
    """Update mutable fields on an existing card and persist changes."""
    if title is not None:
        card.title = title
    if elements is not None:
        card.elements = json.dumps(elements)
    if img_url is not None:
        card.img_url = img_url
    if theme is not None:
        card.theme = json.dumps(theme.model_dump())

    db.commit()
    db.refresh(card)
    return card


def delete_card_by_id(card_id: str, user_id: str, db: Session) -> bool:
    """Delete a card owned by the user. Returns True if deleted, False if not found."""
    card = db.query(Card).filter(Card.id == card_id, Card.user_id == user_id).first()
    if not card:
        return False
    db.delete(card)
    db.commit()
    return True


def toggle_save_card(
    card: Card,
    action: str,
    user_id: str,
    db: Session,
) -> dict:
    """Toggle a card's saved status in the user's default deck.

    ``action`` must be ``"toggle"``, ``"save"``, or ``"unsave"``.
    Returns a dict with ``message`` and ``saved`` keys.
    """
    default_deck = get_or_create_default_deck(user_id, db)
    existing = (
        db.query(DeckCard)
        .filter(DeckCard.deck_id == default_deck.id, DeckCard.card_id == card.id)
        .first()
    )

    if action == "save":
        if not existing:
            next_pos = get_next_deck_position(default_deck.id, db)
            db.add(DeckCard(deck_id=default_deck.id, card_id=card.id, position=next_pos))
            db.commit()
        return {"message": "saved", "saved": True}

    if action == "unsave":
        if existing:
            db.delete(existing)
            db.commit()
            cleanup_orphaned_card(card.id, db)
            db.commit()
        return {"message": "unsaved", "saved": False}

    # action == "toggle"
    if existing:
        db.delete(existing)
        db.commit()
        cleanup_orphaned_card(card.id, db)
        db.commit()
        return {"message": "unsaved", "saved": False}
    else:
        next_pos = get_next_deck_position(default_deck.id, db)
        db.add(DeckCard(deck_id=default_deck.id, card_id=card.id, position=next_pos))
        db.commit()
        return {"message": "saved", "saved": True}


def share_card(card: Card, mode: str, db: Session) -> Card:
    """Enable sharing for a card with the given mode."""
    apply_share(card, mode)
    db.commit()
    db.refresh(card)
    return card


def unshare_card(card: Card, db: Session) -> None:
    """Disable sharing for a card, clearing share fields."""
    remove_share(card)
    db.commit()
