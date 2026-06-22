import json
import secrets
from datetime import UTC, datetime

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
    SaveToggleResponse,
    ShareToggle,
)
from app.utils.deck_helpers import _cleanup_orphaned_card, _get_or_create_default_deck

router = APIRouter(prefix="/api/cards", tags=["cards"])


@router.post("/{card_id}/toggle-save", response_model=SaveToggleResponse)
def toggle_save_card(
    card_id: str,
    action: str = Query("toggle", pattern="^(toggle|save|unsave)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Toggle a card's saved status in the current user's default deck.

    The ``action`` query parameter must be ``toggle``, ``save``, or ``unsave``.
    Requires authentication (``current_user``). Returns 200 with the new saved
    state. Returns 404 if the card does not belong to the user.
    """
    card = db.query(Card).filter(Card.id == card_id, Card.user_id == current_user.id).first()
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")

    default_deck = _get_or_create_default_deck(current_user.id, db)
    existing = (
        db.query(DeckCard)
        .filter(DeckCard.deck_id == default_deck.id, DeckCard.card_id == card_id)
        .first()
    )

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
        return {"message": "saved", "saved": True}

    if action == "unsave":
        if existing:
            db.delete(existing)
            db.commit()
            _cleanup_orphaned_card(card_id, db)
            db.commit()
        return {"message": "unsaved", "saved": False}

    if existing:
        db.delete(existing)
        db.commit()
        _cleanup_orphaned_card(card_id, db)
        db.commit()
        return {"message": "unsaved", "saved": False}
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
        return {"message": "saved", "saved": True}


@router.get("/{card_id}/decks", response_model=list[CardDecksResponse])
def get_card_decks(
    card_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all of the current user's decks that contain the given card.

    Requires authentication. Returns 200 with a list of deck references.
    """
    deck_cards = (
        db.query(Deck)
        .join(DeckCard, DeckCard.deck_id == Deck.id)
        .filter(DeckCard.card_id == card_id, Deck.user_id == current_user.id)
        .all()
    )
    return [
        CardDecksResponse(deck_id=d.id, title=d.title, is_default=d.is_default) for d in deck_cards
    ]


@router.put("/{card_id}/decks", status_code=status.HTTP_204_NO_CONTENT)
def update_card_decks(
    card_id: str,
    body: CardDecksUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Replace the set of decks a card belongs to with the given ``deck_ids``.

    All provided ``deck_ids`` must belong to the current user. Requires
    authentication. Returns 204 on success or 404 if the card is not found.
    """
    card = db.query(Card).filter(Card.id == card_id, Card.user_id == current_user.id).first()
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")

    db.query(DeckCard).filter(
        DeckCard.card_id == card_id,
        DeckCard.deck_id.in_(db.query(Deck.id).filter(Deck.user_id == current_user.id)),
    ).delete(synchronize_session=False)

    for i, deck_id in enumerate(body.deck_ids):
        db.add(DeckCard(deck_id=deck_id, card_id=card_id, position=i))

    db.commit()
    _cleanup_orphaned_card(card_id, db)
    db.commit()


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


@router.get("", response_model=list[CardSummary])
def list_cards(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List cards saved to the current user's default deck.

    Requires authentication. Returns 200 with card summaries ordered by
    most recently updated.
    """
    deck_cards = (
        db.query(Card)
        .join(DeckCard, DeckCard.card_id == Card.id)
        .join(Deck, Deck.id == DeckCard.deck_id)
        .filter(Deck.user_id == current_user.id, Deck.is_default)
        .order_by(Card.updated_at.desc())
        .all()
    )
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
    """Create a new card and add it to the current user's default deck.

    Requires authentication. Returns 201 with the created card on success.
    """
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
    """Get a single card owned by the current user.

    Requires authentication. Returns 200 with the card data or 404 if the
    card is not found or does not belong to the user.
    """
    card = db.query(Card).filter(Card.id == card_id, Card.user_id == current_user.id).first()
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
    """Update a card's title, elements, image URL, or theme.

    Only fields present in the request body are updated. Requires
    authentication and ownership. Returns 200 on success or 404 if the card
    is not found.
    """
    card = db.query(Card).filter(Card.id == card_id, Card.user_id == current_user.id).first()
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
    """Delete a card owned by the current user.

    Requires authentication and ownership. Returns 204 on success or 404 if
    the card is not found.
    """
    card = db.query(Card).filter(Card.id == card_id, Card.user_id == current_user.id).first()
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
    """Enable sharing for a card with the given mode (``view`` or ``view_and_copy``).

    Generates a unique share slug. Requires authentication and ownership.
    Returns 200 with the updated card or 404 if the card is not found.
    """
    card = db.query(Card).filter(Card.id == card_id, Card.user_id == current_user.id).first()
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")

    card.share_slug = secrets.token_urlsafe(6)[:8]
    card.share_mode = body.mode
    card.share_at = datetime.now(UTC)

    db.commit()
    db.refresh(card)
    return card_to_response(card)


@router.delete("/{card_id}/share", status_code=status.HTTP_204_NO_CONTENT)
def unshare_card(
    card_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Disable sharing for a card, removing its share slug and mode.

    Requires authentication and ownership. Returns 204 on success or 404 if
    the card is not found.
    """
    card = db.query(Card).filter(Card.id == card_id, Card.user_id == current_user.id).first()
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")

    card.share_slug = None
    card.share_mode = None
    card.share_at = None

    db.commit()
