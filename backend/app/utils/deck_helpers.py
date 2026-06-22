"""Shared deck helper functions used across route modules."""

from sqlalchemy.orm import Session

from app.models.card import Card
from app.models.deck import Deck, DeckCard


def _get_or_create_default_deck(user_id: str, db: Session) -> Deck:
    """Return the default deck for a user, creating it if it does not exist."""
    deck = db.query(Deck).filter(Deck.user_id == user_id, Deck.is_default).first()
    if not deck:
        deck = Deck(user_id=user_id, title="My Cards", is_default=True)
        db.add(deck)
        db.commit()
        db.refresh(deck)
    return deck


def _cleanup_orphaned_card(card_id: str, db: Session) -> None:
    """Delete a card if it is no longer referenced by any deck."""
    count = db.query(DeckCard).filter(DeckCard.card_id == card_id).count()
    if count == 0:
        db.query(Card).filter(Card.id == card_id).delete()
