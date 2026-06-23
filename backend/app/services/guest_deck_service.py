"""Guest-autosave business logic.

All functions accept a SQLAlchemy ``Session``.  The stored JSON blob is
re-validated on every read (``get_guest_deck``) to catch any corruption.
"""

import json
from datetime import UTC, datetime, timedelta

from sqlalchemy.orm import Session

from app.models.guest_deck import GuestDeck
from app.schemas.guest_deck import GuestCardSchema, GuestDeckResponse, GuestDeckSaveRequest

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_GUEST_DECK_MAX_AGE_DAYS = 30


def _validate_cards_blob(cards_data: list[dict]) -> list[dict]:
    """Re-validate an in-memory cards list against ``GuestCardSchema``."""
    validated: list[dict] = []
    for item in cards_data:
        schema = GuestCardSchema.model_validate(item)
        validated.append(schema.model_dump())
    return validated


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def save_guest_deck(
    deck_id: str,
    payload: GuestDeckSaveRequest,
    db: Session,
) -> GuestDeck:
    """Create or update a guest deck.

    Every card is validated via ``GuestCardSchema`` before the array is
    serialised to ``cards_json``.
    """
    validated: list[dict] = [card.model_dump() for card in payload.cards]
    cards_json = json.dumps(validated)

    existing = db.query(GuestDeck).filter(GuestDeck.id == deck_id).first()

    if existing:
        existing.cards_json = cards_json
        existing.editing_cloud_deck_id = payload.editing_cloud_deck_id
        existing.editing_cloud_deck_title = payload.editing_cloud_deck_title
        existing.last_accessed_at = datetime.now(UTC)
        db.commit()
        db.refresh(existing)
        return existing

    deck = GuestDeck(
        id=deck_id,
        cards_json=cards_json,
        editing_cloud_deck_id=payload.editing_cloud_deck_id,
        editing_cloud_deck_title=payload.editing_cloud_deck_title,
    )
    db.add(deck)
    db.commit()
    db.refresh(deck)
    return deck


def get_guest_deck(deck_id: str, db: Session) -> GuestDeck | None:
    """Return a guest deck with re-validated card data, or ``None``."""
    deck = db.query(GuestDeck).filter(GuestDeck.id == deck_id).first()
    if not deck:
        return None

    # Bump last-accessed timestamp
    deck.last_accessed_at = datetime.now(UTC)
    db.commit()
    db.refresh(deck)

    return deck


def guest_deck_to_response(deck: GuestDeck) -> GuestDeckResponse:
    """Deserialise and re-validate the JSON blob, then build a response."""
    try:
        raw_cards: list = json.loads(deck.cards_json)
    except (json.JSONDecodeError, TypeError):
        raw_cards = []

    validated = _validate_cards_blob(raw_cards)

    return GuestDeckResponse(
        id=deck.id,
        cards=validated,
        editing_cloud_deck_id=deck.editing_cloud_deck_id,
        editing_cloud_deck_title=deck.editing_cloud_deck_title,
    )


def cleanup_stale_guest_decks(db: Session) -> int:
    """Delete guest decks that haven't been accessed in over 30 days.

    Returns the number of deleted rows.
    """
    cutoff = datetime.now(UTC) - timedelta(days=_GUEST_DECK_MAX_AGE_DAYS)
    count = (
        db.query(GuestDeck)
        .filter(GuestDeck.last_accessed_at < cutoff)
        .delete()
    )
    db.commit()
    return count
