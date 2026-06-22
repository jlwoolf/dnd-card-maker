import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.card import Card
from app.models.deck import Deck
from app.schemas import SharedDeckResponse

router = APIRouter(prefix="/api/shared/decks", tags=["shared_decks"])


@router.get("/{slug}", response_model=SharedDeckResponse)
def get_shared_deck(slug: str, db: Session = Depends(get_db)):
    deck = db.query(Deck).filter(Deck.share_slug == slug).first()
    if not deck:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shared deck not found",
        )

    card_ids = [dc.card_id for dc in deck.deck_cards]
    cards = db.query(Card).filter(Card.id.in_(card_ids)).all() if card_ids else []
    card_map = {c.id: c for c in cards}

    cards_data = []
    for dc in deck.deck_cards:
        c = card_map.get(dc.card_id)
        if c:
            cards_data.append({
                "id": c.id,
                "title": c.title,
                "img_url": c.img_url,
                "elements": json.loads(c.elements),
                "theme": json.loads(c.theme),
                "share_slug": c.share_slug,
                "share_mode": c.share_mode,
            })

    return SharedDeckResponse(
        id=deck.id,
        title=deck.title,
        cards=cards_data,
        mode=deck.share_mode,
        can_copy=deck.share_mode == "view_and_copy",
    )
