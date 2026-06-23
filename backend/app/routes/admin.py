from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.constants import ADMIN_DEFAULT_LIMIT
from app.database import get_db
from app.dependencies import DBSession, check_dev_mode
from app.models.card import Card
from app.models.deck import Deck, DeckCard
from app.models.email import SentEmail
from app.models.user import User
from app.services.card_service import card_to_response
from app.services.deck_service import get_deck_cards

TABLES: dict[str, type] = {
    "users": User,
    "cards": Card,
    "decks": Deck,
    "deck_cards": DeckCard,
    "sent_emails": SentEmail,
}

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(check_dev_mode)])


def _serialize(model) -> dict[str, object]:
    result: dict[str, object] = {}
    for col in model.__table__.columns:
        val = getattr(model, col.name)
        if isinstance(val, datetime):
            val = val.isoformat()
        result[col.name] = val
    return result


@router.get("/tables")
def list_tables(
    db: DBSession,
):
    return {"tables": list(TABLES.keys())}


@router.get("/{table_name}")
def get_table_rows(
    table_name: str,
    offset: int = Query(0, ge=0),
    limit: int = Query(ADMIN_DEFAULT_LIMIT, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    model = TABLES.get(table_name)
    if model is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Table '{table_name}' not found",
        )

    total = db.query(model).count()
    rows = db.query(model).offset(offset).limit(limit).all()

    return {
        "rows": [_serialize(r) for r in rows],
        "total": total,
        "offset": offset,
        "limit": limit,
    }


@router.get("/cards/{card_id}")
def get_admin_card(card_id: str, db: DBSession):
    """Return a single card in full detail (dev-only, no auth)."""
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")
    return card_to_response(card)


@router.get("/decks/{deck_id}")
def get_admin_deck(deck_id: str, db: DBSession):
    """Return a deck with full card data (dev-only, no auth)."""
    deck = db.query(Deck).filter(Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deck not found")
    cards_data = get_deck_cards(deck, db, include_saved=True)
    return {
        "id": deck.id,
        "title": deck.title,
        "is_default": deck.is_default,
        "cards": cards_data,
        "share_slug": deck.share_slug,
        "share_mode": deck.share_mode,
    }
