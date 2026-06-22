"""Shared deck helper functions used across route modules."""

from sqlalchemy.orm import Session

from app.constants import DEFAULT_DECK_TITLE
from app.models.card import Card
from app.models.deck import Deck, DeckCard


def _get_or_create_default_deck(user_id: str, db: Session) -> Deck:
    """Return the default deck for a user, creating it if it does not exist."""
    deck = db.query(Deck).filter(Deck.user_id == user_id, Deck.is_default).first()
    if not deck:
        deck = Deck(user_id=user_id, title=DEFAULT_DECK_TITLE, is_default=True)
        db.add(deck)
        db.commit()
        db.refresh(deck)
    return deck


def _cleanup_orphaned_card(card_id: str, db: Session) -> None:
    """Delete a card if it is no longer referenced by any deck."""
    count = db.query(DeckCard).filter(DeckCard.card_id == card_id).count()
    if count == 0:
        db.query(Card).filter(Card.id == card_id).delete()


def get_next_deck_position(deck_id: str, db: Session) -> int:
    """Return the next available position index for a card in the given deck.

    Position is zero-based and sequential. Returns 0 for an empty deck.
    """
    max_pos = (
        db.query(DeckCard.position)
        .filter(DeckCard.deck_id == deck_id)
        .order_by(DeckCard.position.desc())
        .first()
    )
    return (max_pos[0] + 1) if max_pos else 0
