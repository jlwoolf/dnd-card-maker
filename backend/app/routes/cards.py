"""Card API endpoints.

All business logic is delegated to ``app.services.card_service`` so route
handlers stay thin: validate input, call service, return response.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import CurrentUser, DBSession, get_current_user
from app.models.card import Card
from app.models.user import User
from app.schemas import (
    CardCreate,
    CardDecksResponse,
    CardDecksUpdate,
    CardResponse,
    CardSummary,
    CardUpdate,
    SaveToggleResponse,
    ShareToggle,
)
from app.services.card_service import (
    card_to_response,
    create_card,
    delete_card_by_id,
    get_card_by_id,
    list_user_cards,
    share_card,
    toggle_save_card,
    unshare_card,
    update_card,
)

router = APIRouter(prefix="/api/cards", tags=["cards"])


@router.post("/{card_id}/toggle-save", response_model=SaveToggleResponse)
def toggle_save_card_endpoint(
    card_id: str,
    action: str = Query("toggle", pattern="^(toggle|save|unsave)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Toggle a card's saved status in the current user's default deck.

    The ``action`` query parameter must be ``toggle``, ``save``, or ``unsave``.
    Requires authentication. Returns 200 with the new saved state.
    Returns 404 if the card does not belong to the user.
    """
    card: Card | None = get_card_by_id(card_id, current_user.id, db)
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")

    result = toggle_save_card(card, action, current_user.id, db)
    return result


@router.get("/{card_id}/decks", response_model=list[CardDecksResponse])
def get_card_decks(
    card_id: str,
    current_user: CurrentUser,
    db: DBSession,
):
    """Return all of the current user's decks that contain the given card."""
    from app.models.deck import Deck, DeckCard

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
    current_user: CurrentUser,
    db: DBSession,
):
    """Replace the set of decks a card belongs to with the given ``deck_ids``."""
    from app.models.deck import Deck, DeckCard

    card: Card | None = get_card_by_id(card_id, current_user.id, db)
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")

    db.query(DeckCard).filter(
        DeckCard.card_id == card_id,
        DeckCard.deck_id.in_(db.query(Deck.id).filter(Deck.user_id == current_user.id)),
    ).delete(synchronize_session=False)

    for i, deck_id in enumerate(body.deck_ids):
        db.add(DeckCard(deck_id=deck_id, card_id=card_id, position=i))

    db.commit()
    from app.services.deck_service import cleanup_orphaned_card

    cleanup_orphaned_card(card_id, db)
    db.commit()


@router.get("", response_model=list[CardSummary])
def list_cards_endpoint(
    current_user: CurrentUser,
    db: DBSession,
):
    """List cards saved to the current user's default deck."""
    return list_user_cards(current_user.id, db)


@router.post("", response_model=CardResponse, status_code=status.HTTP_201_CREATED)
def create_card_endpoint(
    body: CardCreate,
    current_user: CurrentUser,
    db: DBSession,
):
    """Create a new card and add it to the current user's default deck."""
    card = create_card(
        user_id=current_user.id,
        title=body.title,
        elements=body.elements,
        img_url=body.img_url,
        theme=body.theme,
        db=db,
    )
    return card_to_response(card)


@router.get("/{card_id}", response_model=CardResponse)
def get_card_endpoint(
    card_id: str,
    current_user: CurrentUser,
    db: DBSession,
):
    """Get a single card owned by the current user."""
    card: Card | None = get_card_by_id(card_id, current_user.id, db)
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")
    return card_to_response(card)


@router.put("/{card_id}", response_model=CardResponse)
def update_card_endpoint(
    card_id: str,
    body: CardUpdate,
    current_user: CurrentUser,
    db: DBSession,
):
    """Update a card's title, elements, image URL, or theme."""
    card: Card | None = get_card_by_id(card_id, current_user.id, db)
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")

    updated = update_card(
        card=card,
        title=body.title,
        elements=body.elements,
        img_url=body.img_url,
        theme=body.theme,
        db=db,
    )
    return card_to_response(updated)


@router.delete("/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_card_endpoint(
    card_id: str,
    current_user: CurrentUser,
    db: DBSession,
):
    """Delete a card owned by the current user."""
    if not delete_card_by_id(card_id, current_user.id, db):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")


@router.post("/{card_id}/share", response_model=CardResponse)
def share_card_endpoint(
    card_id: str,
    body: ShareToggle,
    current_user: CurrentUser,
    db: DBSession,
):
    """Enable sharing for a card with the given mode."""
    card: Card | None = get_card_by_id(card_id, current_user.id, db)
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")

    updated = share_card(card, body.mode, db)
    return card_to_response(updated)


@router.delete("/{card_id}/share", status_code=status.HTTP_204_NO_CONTENT)
def unshare_card_endpoint(
    card_id: str,
    current_user: CurrentUser,
    db: DBSession,
):
    """Disable sharing for a card, removing its share slug and mode."""
    card: Card | None = get_card_by_id(card_id, current_user.id, db)
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")

    unshare_card(card, db)
