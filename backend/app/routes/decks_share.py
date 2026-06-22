"""Public shared-deck endpoint.

Uses the shared ``get_deck_cards_for_share`` helper from the deck service
instead of duplicating card-assembly logic.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.deck import Deck
from app.schemas import SharedDeckResponse
from app.services.deck_service import get_deck_cards_for_share, get_shared_deck_by_slug

router = APIRouter(prefix="/api/shared/decks", tags=["shared_decks"])


@router.get("/{slug}", response_model=SharedDeckResponse)
def get_shared_deck(slug: str, db: Session = Depends(get_db)):
    """Retrieve a publicly shared deck by its slug.

    No authentication required. Returns 200 with the deck data including its
    cards and a ``can_copy`` flag based on the share mode. Returns 404 if no
    shared deck matches the slug.
    """
    deck: Deck | None = get_shared_deck_by_slug(slug, db)
    if not deck:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shared deck not found",
        )

    cards_data = get_deck_cards_for_share(deck, db)
    return SharedDeckResponse(
        id=deck.id,
        title=deck.title,
        cards=cards_data,
        mode=deck.share_mode,
        can_copy=deck.share_mode == "view_and_copy",
    )
