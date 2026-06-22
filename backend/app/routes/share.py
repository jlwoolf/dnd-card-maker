import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.card import Card
from app.schemas import CardThemeSchema, SharedCardResponse

router = APIRouter(prefix="/api/shared", tags=["shared"])


@router.get("/{slug}", response_model=SharedCardResponse)
def get_shared_card(slug: str, db: Session = Depends(get_db)):
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

    return SharedCardResponse(
        id=card.id,
        title=card.title,
        elements=json.loads(card.elements),
        img_url=card.img_url,
        theme=CardThemeSchema(**json.loads(card.theme)),
        mode=card.share_mode,
        can_copy=card.share_mode == "view_and_copy",
    )
