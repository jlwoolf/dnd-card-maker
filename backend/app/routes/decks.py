"""Deck API endpoints.

All business logic is delegated to ``app.services.deck_service`` so route
handlers stay thin.
"""

from fastapi import APIRouter, HTTPException, status

from app.dependencies import CurrentUser, DBSession
from app.models.deck import Deck
from app.schemas import (
    DeckCardsBatchRequest,
    DeckCardsBatchResponse,
    DeckCreate,
    DeckResponse,
    DeckSaveRequest,
    DeckShareToggle,
    DeckSummary,
    DeckUpdate,
)
from app.services.deck_service import (
    count_user_cards_by_ids,
    create_deck_with_cards,
    deck_to_response,
    delete_deck,
    get_autosave_deck,
    get_deck_by_id,
    list_user_decks,
    save_autosave_deck,
    save_deck_with_cards,
    share_deck,
    unshare_deck,
    update_deck,
    upsert_deck_cards_batch,
)

router = APIRouter(prefix="/api/decks", tags=["decks"])


@router.get("", response_model=list[DeckSummary])
def list_decks_endpoint(
    current_user: CurrentUser,
    db: DBSession,
):
    """List all decks belonging to the current user."""
    return list_user_decks(current_user.id, db)


@router.post("", response_model=DeckResponse, status_code=status.HTTP_201_CREATED)
def create_deck_endpoint(
    body: DeckCreate,
    current_user: CurrentUser,
    db: DBSession,
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
    return deck_to_response(deck, db)


@router.post("/save", response_model=DeckResponse, status_code=status.HTTP_201_CREATED)
def save_deck_endpoint(
    body: DeckSaveRequest,
    current_user: CurrentUser,
    db: DBSession,
):
    """Save or update an entire deck in a single request.

    Accepts either ``cards`` (full card data) for small decks, or ``card_ids``
    (pre-uploaded card IDs) for large decks that were batched.
    """
    cards_input = None
    if body.cards:
        cards_input = [
            {
                "id": c.id,
                "elements": c.elements,
                "img_url": c.img_url,
                "theme": c.theme,
            }
            for c in body.cards
        ]

    deck = save_deck_with_cards(
        user_id=current_user.id,
        title=body.title,
        cards_input=cards_input or [],
        db=db,
        deck_id=body.deck_id,
        card_ids=body.card_ids,
    )
    return deck_to_response(deck, db)


@router.post("/save/cards", response_model=DeckCardsBatchResponse, status_code=status.HTTP_201_CREATED)
def save_deck_cards_batch_endpoint(
    body: DeckCardsBatchRequest,
    current_user: CurrentUser,
    db: DBSession,
):
    """Upload cards in a batch for large decks."""
    cards_input = [
        {
            "id": c.id,
            "elements": c.elements,
            "img_url": c.img_url,
            "theme": c.theme,
        }
        for c in body.cards
    ]
    card_ids = upsert_deck_cards_batch(current_user.id, cards_input, db)
    db.commit()
    return DeckCardsBatchResponse(card_ids=card_ids)


@router.get("/autosave", response_model=DeckResponse | None)
def get_autosave_endpoint(
    current_user: CurrentUser,
    db: DBSession,
):
    """Get the current user's autosave deck, or empty if none exists."""
    deck = get_autosave_deck(current_user.id, db)
    if not deck:
        return None
    return deck_to_response(deck, db)


@router.put("/autosave", response_model=DeckResponse, status_code=status.HTTP_201_CREATED)
def save_autosave_endpoint(
    body: DeckCardsBatchRequest,
    current_user: CurrentUser,
    db: DBSession,
):
    """Save or update the user's autosave deck with the given cards."""
    cards_input = [
        {
            "id": c.id,
            "elements": c.elements,
            "img_url": c.img_url,
            "theme": c.theme,
        }
        for c in body.cards
    ]
    deck = save_autosave_deck(current_user.id, cards_input, db)
    return deck_to_response(deck, db)


@router.get("/{deck_id}", response_model=DeckResponse)
def get_deck_endpoint(
    deck_id: str,
    current_user: CurrentUser,
    db: DBSession,
):
    """Get a single deck owned by the current user."""
    deck: Deck | None = get_deck_by_id(deck_id, current_user.id, db)
    if not deck:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deck not found")
    return deck_to_response(deck, db)


@router.put("/{deck_id}", response_model=DeckResponse)
def update_deck_endpoint(
    deck_id: str,
    body: DeckUpdate,
    current_user: CurrentUser,
    db: DBSession,
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
    return deck_to_response(updated, db)


@router.delete("/{deck_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_deck_endpoint(
    deck_id: str,
    current_user: CurrentUser,
    db: DBSession,
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
    current_user: CurrentUser,
    db: DBSession,
):
    """Enable sharing for a deck with the given mode."""
    deck: Deck | None = get_deck_by_id(deck_id, current_user.id, db)
    if not deck:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deck not found")

    updated = share_deck(deck, body.mode, db)
    return deck_to_response(updated, db)


@router.delete("/{deck_id}/share", status_code=status.HTTP_204_NO_CONTENT)
def unshare_deck_endpoint(
    deck_id: str,
    current_user: CurrentUser,
    db: DBSession,
):
    """Disable sharing for a deck, removing its share slug and mode."""
    deck: Deck | None = get_deck_by_id(deck_id, current_user.id, db)
    if not deck:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deck not found")

    unshare_deck(deck, db)
