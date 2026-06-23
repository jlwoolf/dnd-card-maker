"""Public shared-deck endpoint.

Uses the shared ``deck_to_shared_response`` helper from the deck service
instead of duplicating card-assembly logic.
"""

from fastapi import APIRouter, HTTPException, status

from app.dependencies import DBSession
from app.models.deck import Deck
from app.services.deck_service import deck_to_shared_response, get_shared_deck_by_slug

router = APIRouter(prefix="/api/shared/decks", tags=["shared_decks"])


@router.get("/{slug}")
def get_shared_deck(slug: str, db: DBSession):
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

    return deck_to_shared_response(deck, db)
