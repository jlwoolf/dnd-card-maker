from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.card import Card
from app.models.deck import Deck, DeckCard
from app.models.email import SentEmail
from app.models.user import User

TABLES: dict[str, type] = {
    "users": User,
    "cards": Card,
    "decks": Deck,
    "deck_cards": DeckCard,
    "sent_emails": SentEmail,
}

router = APIRouter(prefix="/api/admin", tags=["admin"])


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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return {"tables": list(TABLES.keys())}


@router.get("/{table_name}")
def get_table_rows(
    table_name: str,
    offset: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
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
