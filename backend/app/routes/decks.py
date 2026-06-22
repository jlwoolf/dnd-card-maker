"""Deck API endpoints.

All business logic is delegated to ``app.services.deck_service`` so route
handlers stay thin.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.deck import Deck
from app.models.user import User
from app.schemas import (
    DeckCreate,
    DeckResponse,
    DeckSaveRequest,
    DeckShareToggle,
    DeckSummary,
    DeckUpdate,
)
from app.services.deck_service import (
    _get_deck_cards,
    count_user_cards_by_ids,
    create_deck_with_cards,
    delete_deck,
    get_deck_by_id,
    list_user_decks,
    save_deck_with_cards,
    share_deck,
    unshare_deck,
    update_deck,
)

router = APIRouter(prefix="/api/decks", tags=["decks"])


def _build_deck_response(deck: Deck, db: Session) -> DeckResponse:
    """Serialize a Deck model into a DeckResponse including its cards."""
    cards_data = _get_deck_cards(deck, db)
    return DeckResponse(
        id=deck.id,
        user_id=deck.user_id,
        title=deck.title,
        is_default=deck.is_default,
        cards=cards_data,
        share_slug=deck.share_slug,
        share_mode=deck.share_mode,
        share_at=deck.share_at,
        created_at=deck.created_at,
        updated_at=deck.updated_at,
    )


@router.get("", response_model=list[DeckSummary])
def list_decks_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all decks belonging to the current user."""
    return list_user_decks(current_user.id, db)


@router.post("", response_model=DeckResponse, status_code=status.HTTP_201_CREATED)
def create_deck_endpoint(
    body: DeckCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new deck with optional initial card assignments."""
    if body.card_ids:
        owned_count = count_user_cards_by_ids(current_user.id, body.card_ids, db)
        if owned_count != len(set(body.card_ids)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more card IDs do not belong to you",
            )

    deck = create_deck_with_cards(
        user_id=current_user.id,
        title=body.title,
        card_ids=body.card_ids,
        db=db,
    )
    return _build_deck_response(deck, db)


@router.post("/save", response_model=DeckResponse, status_code=status.HTTP_201_CREATED)
def save_deck_endpoint(
    body: DeckSaveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save or update an entire deck with cards in a single request."""
    deck = save_deck_with_cards(
        user_id=current_user.id,
        title=body.title,
        cards_input=[
            {
                "id": c.id,
                "elements": c.elements,
                "img_url": c.img_url,
                "theme": c.theme,
            }
            for c in body.cards
        ],
        db=db,
    )
    return _build_deck_response(deck, db)


@router.get("/{deck_id}", response_model=DeckResponse)
def get_deck_endpoint(
    deck_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a single deck owned by the current user."""
    deck: Deck | None = get_deck_by_id(deck_id, current_user.id, db)
    if not deck:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deck not found")
    return _build_deck_response(deck, db)


@router.put("/{deck_id}", response_model=DeckResponse)
def update_deck_endpoint(
    deck_id: str,
    body: DeckUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a deck's title and/or its card assignments."""
    deck: Deck | None = get_deck_by_id(deck_id, current_user.id, db)
    if not deck:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deck not found")

    if body.card_ids is not None and body.card_ids:
        owned_count = count_user_cards_by_ids(current_user.id, body.card_ids, db)
        if owned_count != len(set(body.card_ids)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more card IDs do not belong to you",
            )

    updated = update_deck(
        deck=deck,
        title=body.title,
        card_ids=body.card_ids,
        user_id=current_user.id,
        db=db,
    )
    return _build_deck_response(updated, db)


@router.delete("/{deck_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_deck_endpoint(
    deck_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a deck and clean up any orphaned cards."""
    deck: Deck | None = get_deck_by_id(deck_id, current_user.id, db)
    if not deck:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deck not found")
    if deck.is_default:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete default deck",
        )

    delete_deck(deck, db)


@router.post("/{deck_id}/share", response_model=DeckResponse)
def share_deck_endpoint(
    deck_id: str,
    body: DeckShareToggle,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Enable sharing for a deck with the given mode."""
    deck: Deck | None = get_deck_by_id(deck_id, current_user.id, db)
    if not deck:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deck not found")

    updated = share_deck(deck, body.mode, db)
    return _build_deck_response(updated, db)


@router.delete("/{deck_id}/share", status_code=status.HTTP_204_NO_CONTENT)
def unshare_deck_endpoint(
    deck_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Disable sharing for a deck, removing its share slug and mode."""
    deck: Deck | None = get_deck_by_id(deck_id, current_user.id, db)
    if not deck:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deck not found")

    unshare_deck(deck, db)
