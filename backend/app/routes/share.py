"""Public shared-card endpoint."""

from fastapi import APIRouter, HTTPException, status

from app.dependencies import DBSession
from app.models.card import Card
from app.services.card_service import card_to_shared_response

router = APIRouter(prefix="/api/shared", tags=["shared"])


@router.get("/{slug}")
def get_shared_card(slug: str, db: DBSession):
    """Retrieve a publicly shared card by its slug.

    No authentication required. Returns 200 with the card data and a
    ``can_copy`` flag based on the share mode. Returns 404 if no shared
    card matches the slug.
    """
    card = db.query(Card).filter(Card.share_slug == slug).first()
    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shared card not found",
        )

    return card_to_shared_response(card)
