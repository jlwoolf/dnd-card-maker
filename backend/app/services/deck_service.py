"""Deck business logic extracted from route handlers.

All functions accept a SQLAlchemy ``Session``. The ``_get_deck_cards`` helper
is shared between the authenticated deck endpoints and the public share endpoint.
"""

import json
from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.models.card import Card
from app.models.deck import Deck, DeckCard
from app.utils.deck_helpers import _cleanup_orphaned_card
from app.utils.shared import generate_share_slug


def _get_deck_cards(deck: Deck, db: Session) -> list[dict]:
    """Return card data for every card in the given deck, including saved status.

    This is the canonical helper used by both authenticated deck routes and the
    public shared-deck endpoint. It builds a list of dicts suitable for
    serialization into ``DeckResponse`` or ``SharedDeckResponse``.
    """
    card_ids = [dc.card_id for dc in deck.deck_cards]
    cards = db.query(Card).filter(Card.id.in_(card_ids)).all() if card_ids else []
    card_map = {c.id: c for c in cards}

    default_deck = db.query(Deck).filter(Deck.user_id == deck.user_id, Deck.is_default).first()
    default_card_ids: set[str] = set()
    if default_deck:
        default_card_ids = {dc.card_id for dc in default_deck.deck_cards}

    result: list[dict] = []
    for dc in deck.deck_cards:
        c = card_map.get(dc.card_id)
        if c:
            result.append(
                {
                    "id": c.id,
                    "title": c.title,
                    "img_url": c.img_url,
                    "saved": c.id in default_card_ids,
                    "elements": json.loads(c.elements),
                    "theme": json.loads(c.theme),
                    "share_slug": c.share_slug,
                    "share_mode": c.share_mode,
                }
            )
    return result


def get_deck_cards_for_share(deck: Deck, db: Session) -> list[dict]:
    """Return card data for a shared deck (no ``saved`` flag, no ownership info)."""
    card_ids = [dc.card_id for dc in deck.deck_cards]
    cards = db.query(Card).filter(Card.id.in_(card_ids)).all() if card_ids else []
    card_map = {c.id: c for c in cards}

    cards_data: list[dict] = []
    for dc in deck.deck_cards:
        c = card_map.get(dc.card_id)
        if c:
            cards_data.append(
                {
                    "id": c.id,
                    "title": c.title,
                    "img_url": c.img_url,
                    "elements": json.loads(c.elements),
                    "theme": json.loads(c.theme),
                    "share_slug": c.share_slug,
                    "share_mode": c.share_mode,
                }
            )
    return cards_data


def list_user_decks(user_id: str, db: Session) -> list[dict]:
    """Return summary data for all decks belonging to the user."""
    from app.schemas.deck import DeckSummary

    decks = (
        db.query(Deck)
        .filter(Deck.user_id == user_id)
        .order_by(Deck.is_default.desc(), Deck.updated_at.desc())
        .all()
    )
    result: list[dict] = []
    for d in decks:
        card_count = len(d.deck_cards)
        first_card = (
            db.query(Card)
            .filter(Card.id.in_([dc.card_id for dc in d.deck_cards]))
            .order_by(Card.created_at.asc())
            .first()
        )
        result.append(
            DeckSummary(
                id=d.id,
                title=d.title,
                is_default=d.is_default,
                card_count=card_count,
                first_card_img_url=first_card.img_url if first_card else None,
                first_card_id=first_card.id if first_card else None,
                share_slug=d.share_slug,
                share_mode=d.share_mode,
                created_at=d.created_at,
                updated_at=d.updated_at,
            ).model_dump()
        )
    return result


def get_deck_by_id(deck_id: str, user_id: str, db: Session) -> Deck | None:
    """Retrieve a single deck owned by the user, or None."""
    return db.query(Deck).filter(Deck.id == deck_id, Deck.user_id == user_id).first()


def create_deck_with_cards(
    user_id: str,
    title: str,
    card_ids: list[str],
    db: Session,
) -> Deck:
    """Create a new deck with the given card IDs.

    Ownership of card_ids must be validated by the caller.
    """
    deck = Deck(user_id=user_id, title=title, is_default=False)
    db.add(deck)
    db.flush()

    for i, card_id in enumerate(card_ids):
        db.add(DeckCard(deck_id=deck.id, card_id=card_id, position=i))

    db.commit()
    db.refresh(deck)
    return deck


def update_deck(
    deck: Deck,
    title: str | None,
    card_ids: list[str] | None,
    user_id: str,
    db: Session,
) -> Deck:
    """Update a deck's title and/or card assignments.

    Ownership of card_ids must be validated by the caller.
    """
    if title is not None:
        deck.title = title
    if card_ids is not None:
        old_card_ids = [
            dc.card_id for dc in db.query(DeckCard).filter(DeckCard.deck_id == deck.id).all()
        ]
        db.query(DeckCard).filter(DeckCard.deck_id == deck.id).delete()
        for i, card_id in enumerate(card_ids):
            db.add(DeckCard(deck_id=deck.id, card_id=card_id, position=i))
        db.commit()
        for card_id in old_card_ids:
            _cleanup_orphaned_card(card_id, db)
        db.commit()
    else:
        db.commit()

    db.refresh(deck)
    return deck


def _upsert_cards(
    user_id: str,
    cards_input: list[dict],
    db: Session,
) -> list[str]:
    """Create or update cards and return their IDs.

    Each item in ``cards_input`` must have ``elements``, ``img_url``, ``theme``
    and optionally an ``id`` for updates.
    """
    card_ids: list[str] = []
    for card_input in cards_input:
        if card_input.get("id"):
            card = (
                db.query(Card)
                .filter(Card.id == card_input["id"], Card.user_id == user_id)
                .first()
            )
            if card:
                card.elements = json.dumps(card_input["elements"])
                card.img_url = card_input["img_url"]
                card.theme = json.dumps(card_input["theme"].model_dump())
                card_ids.append(card.id)
                continue
        card = Card(
            user_id=user_id,
            elements=json.dumps(card_input["elements"]),
            img_url=card_input["img_url"],
            theme=json.dumps(card_input["theme"].model_dump()),
        )
        db.add(card)
        db.flush()
        card_ids.append(card.id)
    return card_ids


def save_deck_with_cards(
    user_id: str,
    title: str,
    cards_input: list[dict],
    db: Session,
    deck_id: str | None = None,
    card_ids: list[str] | None = None,
) -> Deck:
    """Save or update an entire deck with cards in a single operation.

    Two modes:
    - ``cards_input`` provided: cards are created/updated and linked to the deck.
    - ``card_ids`` provided (cards_input empty): existing cards are linked to the deck.
    """
    if cards_input:
        card_ids = _upsert_cards(user_id, cards_input, db)

    if not card_ids:
        card_ids = []

    if deck_id:
        existing = (
            db.query(Deck)
            .filter(Deck.id == deck_id, Deck.user_id == user_id)
            .first()
        )
    else:
        existing = (
            db.query(Deck)
            .filter(
                Deck.user_id == user_id,
                Deck.title == title,
                not Deck.is_default,
            )
            .first()
        )

    if existing:
        deck = existing
        old_card_ids = [
            dc.card_id for dc in db.query(DeckCard).filter(DeckCard.deck_id == deck.id).all()
        ]
        db.query(DeckCard).filter(DeckCard.deck_id == deck.id).delete()
    else:
        deck = Deck(user_id=user_id, title=title, is_default=False)
        db.add(deck)
        db.flush()
        old_card_ids = []

    for i, card_id in enumerate(card_ids):
        db.add(DeckCard(deck_id=deck.id, card_id=card_id, position=i))

    db.commit()
    for card_id in old_card_ids:
        _cleanup_orphaned_card(card_id, db)
    db.commit()
    db.refresh(deck)
    return deck


def delete_deck(deck: Deck, db: Session) -> None:
    """Delete a deck and clean up any orphaned cards."""
    old_card_ids = [dc.card_id for dc in deck.deck_cards]
    db.delete(deck)
    db.commit()
    for card_id in old_card_ids:
        _cleanup_orphaned_card(card_id, db)
    db.commit()


def upsert_deck_cards_batch(
    user_id: str,
    cards_input: list[dict],
    db: Session,
) -> list[str]:
    """Create or update cards and return their IDs without deck association."""
    return _upsert_cards(user_id, cards_input, db)


def share_deck(deck: Deck, mode: str, db: Session) -> Deck:
    """Enable sharing for a deck with the given mode."""
    deck.share_slug = generate_share_slug()
    deck.share_mode = mode
    deck.share_at = datetime.now(UTC)
    db.commit()
    db.refresh(deck)
    return deck


def unshare_deck(deck: Deck, db: Session) -> None:
    """Disable sharing for a deck, clearing share fields."""
    deck.share_slug = None
    deck.share_mode = None
    deck.share_at = None
    db.commit()


def get_shared_deck_by_slug(slug: str, db: Session) -> Deck | None:
    """Retrieve a publicly shared deck by its slug."""
    return db.query(Deck).filter(Deck.share_slug == slug).first()


def count_user_cards_by_ids(user_id: str, card_ids: list[str], db: Session) -> int:
    """Count how many of the given card IDs belong to the user.

    When the count matches the length of the deduplicated ``card_ids`` list,
    all cards are owned by the user.
    """
    return (
        db.query(Card)
        .filter(Card.id.in_(card_ids), Card.user_id == user_id)
        .count()
    )
