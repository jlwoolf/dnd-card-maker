import json
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.card import Card
from app.models.deck import Deck, DeckCard
from app.models.user import User
from app.routes.cards import _cleanup_orphaned_card
from app.schemas import (
    DeckCreate,
    DeckResponse,
    DeckSaveRequest,
    DeckShareToggle,
    DeckSummary,
    DeckUpdate,
    CardThemeSchema,
)

router = APIRouter(prefix="/api/decks", tags=["decks"])


def _get_or_create_default_deck(user_id: str, db: Session) -> Deck:
    deck = db.query(Deck).filter(Deck.user_id == user_id, Deck.is_default == True).first()
    if not deck:
        deck = Deck(user_id=user_id, title="My Cards", is_default=True)
        db.add(deck)
        db.commit()
        db.refresh(deck)
    return deck


@router.get("", response_model=list[DeckSummary])
def list_decks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    decks = (
        db.query(Deck)
        .filter(Deck.user_id == current_user.id)
        .order_by(Deck.is_default.desc(), Deck.updated_at.desc())
        .all()
    )
    result = []
    for d in decks:
        card_count = len(d.deck_cards)
        first_card = (
            db.query(Card)
            .filter(Card.id.in_([dc.card_id for dc in d.deck_cards]))
            .order_by(Card.created_at.asc())
            .first()
        )
        result.append(
            DeckSummary(
                id=d.id,
                title=d.title,
                is_default=d.is_default,
                card_count=card_count,
                first_card_img_url=first_card.img_url if first_card else None,
                share_slug=d.share_slug,
                share_mode=d.share_mode,
                created_at=d.created_at,
                updated_at=d.updated_at,
            )
        )
    return result


@router.post("", response_model=DeckResponse, status_code=status.HTTP_201_CREATED)
def create_deck(
    body: DeckCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    deck = Deck(user_id=current_user.id, title=body.title, is_default=False)
    db.add(deck)
    db.flush()

    for i, card_id in enumerate(body.card_ids):
        db.add(DeckCard(deck_id=deck.id, card_id=card_id, position=i))

    db.commit()
    db.refresh(deck)

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


@router.post("/save", response_model=DeckResponse, status_code=status.HTTP_201_CREATED)
def save_deck(
    body: DeckSaveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    card_ids = []
    for card_input in body.cards:
        if card_input.id:
            card = db.query(Card).filter(Card.id == card_input.id, Card.user_id == current_user.id).first()
            if card:
                card.elements = json.dumps(card_input.elements)
                card.img_url = card_input.img_url
                card.theme = json.dumps(card_input.theme)
                card_ids.append(card.id)
                continue
        card = Card(
            user_id=current_user.id,
            elements=json.dumps(card_input.elements),
            img_url=card_input.img_url,
            theme=json.dumps(card_input.theme),
        )
        db.add(card)
        db.flush()
        card_ids.append(card.id)

    existing = db.query(Deck).filter(
        Deck.user_id == current_user.id,
        Deck.title == body.title,
        Deck.is_default == False,
    ).first()

    if existing:
        deck = existing
        old_card_ids = [dc.card_id for dc in db.query(DeckCard).filter(DeckCard.deck_id == deck.id).all()]
        db.query(DeckCard).filter(DeckCard.deck_id == deck.id).delete()
    else:
        deck = Deck(user_id=current_user.id, title=body.title, is_default=False)
        db.add(deck)
        db.flush()
        old_card_ids = []

    for i, card_id in enumerate(card_ids):
        db.add(DeckCard(deck_id=deck.id, card_id=card_id, position=i))

    db.commit()
    for card_id in old_card_ids:
        _cleanup_orphaned_card(card_id, db)
    db.commit()
    db.refresh(deck)

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


def _get_deck_cards(deck: Deck, db: Session) -> list[dict]:
    card_ids = [dc.card_id for dc in deck.deck_cards]
    cards = db.query(Card).filter(Card.id.in_(card_ids)).all() if card_ids else []
    card_map = {c.id: c for c in cards}

    default_deck = db.query(Deck).filter(Deck.user_id == deck.user_id, Deck.is_default == True).first()
    default_card_ids: set[str] = set()
    if default_deck:
        default_card_ids = {dc.card_id for dc in default_deck.deck_cards}

    result = []
    for dc in deck.deck_cards:
        c = card_map.get(dc.card_id)
        if c:
            result.append({
                "id": c.id,
                "title": c.title,
                "img_url": c.img_url,
                "saved": c.id in default_card_ids,
                "elements": json.loads(c.elements),
                "theme": json.loads(c.theme),
                "share_slug": c.share_slug,
                "share_mode": c.share_mode,
            })
    return result


@router.get("/{deck_id}", response_model=DeckResponse)
def get_deck(
    deck_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    deck = (
        db.query(Deck)
        .filter(Deck.id == deck_id, Deck.user_id == current_user.id)
        .first()
    )
    if not deck:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deck not found")

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


@router.put("/{deck_id}", response_model=DeckResponse)
def update_deck(
    deck_id: str,
    body: DeckUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    deck = (
        db.query(Deck)
        .filter(Deck.id == deck_id, Deck.user_id == current_user.id)
        .first()
    )
    if not deck:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deck not found")

    if body.title is not None:
        deck.title = body.title
    if body.card_ids is not None:
        old_card_ids = [dc.card_id for dc in db.query(DeckCard).filter(DeckCard.deck_id == deck.id).all()]
        db.query(DeckCard).filter(DeckCard.deck_id == deck.id).delete()
        for i, card_id in enumerate(body.card_ids):
            db.add(DeckCard(deck_id=deck.id, card_id=card_id, position=i))
        db.commit()
        for card_id in old_card_ids:
            _cleanup_orphaned_card(card_id, db)
        db.commit()
    else:
        db.commit()

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


@router.delete("/{deck_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_deck(
    deck_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    deck = (
        db.query(Deck)
        .filter(Deck.id == deck_id, Deck.user_id == current_user.id)
        .first()
    )
    if not deck:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deck not found")
    if deck.is_default:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete default deck")

    db.delete(deck)
    db.commit()


@router.post("/{deck_id}/share", response_model=DeckResponse)
def share_deck(
    deck_id: str,
    body: DeckShareToggle,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.mode not in ("view_only", "view_and_copy"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mode must be 'view_only' or 'view_and_copy'",
        )

    deck = (
        db.query(Deck)
        .filter(Deck.id == deck_id, Deck.user_id == current_user.id)
        .first()
    )
    if not deck:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deck not found")

    deck.share_slug = secrets.token_urlsafe(6)[:8]
    deck.share_mode = body.mode
    deck.share_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(deck)

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


@router.delete("/{deck_id}/share", status_code=status.HTTP_204_NO_CONTENT)
def unshare_deck(
    deck_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    deck = (
        db.query(Deck)
        .filter(Deck.id == deck_id, Deck.user_id == current_user.id)
        .first()
    )
    if not deck:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deck not found")

    deck.share_slug = None
    deck.share_mode = None
    deck.share_at = None
    db.commit()
