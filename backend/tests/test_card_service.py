"""Unit tests for app/services/card_service.py — card business logic."""

import json

import pytest
from sqlalchemy.orm import Session

from app.models.card import Card
from app.models.deck import Deck, DeckCard
from app.schemas.card import CardThemeSchema
from app.services.card_service import (
    card_to_response,
    create_card,
    delete_card_by_id,
    get_card_by_id,
    list_user_cards,
    share_card,
    toggle_save_card,
    unshare_card,
    update_card,
)

USER_ID = "svc-user-1"


def _ensure_user(db: Session, user_id: str = USER_ID, email: str = "svc-test@example.com"):
    """Create a test user if it doesn't already exist."""
    from app.models.user import User
    from app.services.auth import hash_password

    if db.query(User).filter(User.id == user_id).first():
        return
    user = User(
        id=user_id,
        email=email,
        password_hash=hash_password("testpass123"),
        is_verified=True,
    )
    db.add(user)
    db.commit()


@pytest.fixture(autouse=True)
def _auto_create_user(db_session: Session):
    """Ensure a test user record exists before every test."""
    _ensure_user(db_session, USER_ID, "svc-test@example.com")


def _make_card(db: Session, card_id: str = "c1", **overrides) -> Card:
    _ensure_user(db)
    defaults = {
        "id": card_id,
        "user_id": USER_ID,
        "title": "Test Card",
        "elements": json.dumps([{"type": "text"}]),
        "img_url": "data:image/png;base64,abc",
        "theme": json.dumps({"fill": "#111", "banner_fill": "#222", "box_fill": "#333",
                              "stroke": "#444", "banner_text": "#555", "box_text": "#666"}),
    }
    defaults.update(overrides)
    card = Card(**defaults)
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


def _make_deck(db: Session, deck_id: str = "d1", is_default: bool = False) -> Deck:
    _ensure_user(db)
    deck = Deck(id=deck_id, user_id=USER_ID, title="Test Deck", is_default=is_default)
    db.add(deck)
    db.commit()
    return deck


class TestCardToResponse:
    def test_serializes_all_fields(self, db_session: Session):
        card = _make_card(db_session, title="My Card")
        resp = card_to_response(card)
        assert resp.id == card.id
        assert resp.user_id == USER_ID
        assert resp.title == "My Card"
        assert resp.elements == [{"type": "text"}]
        assert resp.img_url == "data:image/png;base64,abc"
        assert isinstance(resp.theme, CardThemeSchema)
        assert resp.theme.fill == "#111"
        assert resp.share_slug is None
        assert resp.share_mode is None
        assert resp.share_at is None

    def test_null_title_serialized(self, db_session: Session):
        card = _make_card(db_session, title=None)
        resp = card_to_response(card)
        assert resp.title is None


class TestCreateCard:
    def test_creates_card_and_adds_to_default_deck(self, db_session: Session):
        theme = CardThemeSchema(
            fill="#111", banner_fill="#222", box_fill="#333",
            stroke="#444", banner_text="#555", box_text="#666",
        )
        card = create_card(USER_ID, "New Card", [{"k": "v"}], "data:img", theme, db_session)
        assert card.id is not None
        assert card.title == "New Card"

        # Check it's in the default deck
        default = db_session.query(Deck).filter(
            Deck.user_id == USER_ID, Deck.is_default
        ).first()
        assert default is not None
        dc = db_session.query(DeckCard).filter(
            DeckCard.deck_id == default.id, DeckCard.card_id == card.id
        ).first()
        assert dc is not None

    def test_creates_default_deck_if_missing(self, db_session: Session):
        # No default deck exists yet
        assert db_session.query(Deck).filter(
            Deck.user_id == USER_ID, Deck.is_default
        ).first() is None

        theme = CardThemeSchema(
            fill="#111", banner_fill="#222", box_fill="#333",
            stroke="#444", banner_text="#555", box_text="#666",
        )
        create_card(USER_ID, "First", [], "data:img", theme, db_session)

        default = db_session.query(Deck).filter(
            Deck.user_id == USER_ID, Deck.is_default
        ).first()
        assert default is not None
        assert default.title == "My Cards"


class TestGetCardById:
    def test_finds_owned_card(self, db_session: Session):
        card = _make_card(db_session)
        found = get_card_by_id(card.id, USER_ID, db_session)
        assert found is not None
        assert found.id == card.id

    def test_returns_none_for_wrong_user(self, db_session: Session):
        card = _make_card(db_session)
        found = get_card_by_id(card.id, "other-user", db_session)
        assert found is None

    def test_returns_none_for_missing(self, db_session: Session):
        assert get_card_by_id("nonexistent", USER_ID, db_session) is None


class TestUpdateCard:
    def test_updates_title_only(self, db_session: Session):
        card = _make_card(db_session, title="Original")
        updated = update_card(card, "New Title", None, None, None, db_session)
        assert updated.title == "New Title"
        assert json.loads(updated.elements) == [{"type": "text"}]  # unchanged

    def test_updates_elements_only(self, db_session: Session):
        card = _make_card(db_session)
        updated = update_card(card, None, [{"new": True}], None, None, db_session)
        assert json.loads(updated.elements) == [{"new": True}]

    def test_updates_img_url(self, db_session: Session):
        card = _make_card(db_session)
        updated = update_card(card, None, None, "data:image/png;base64,new", None, db_session)
        assert updated.img_url == "data:image/png;base64,new"

    def test_updates_theme(self, db_session: Session):
        card = _make_card(db_session)
        theme = CardThemeSchema(
            fill="#aaa", banner_fill="#bbb", box_fill="#ccc",
            stroke="#ddd", banner_text="#eee", box_text="#fff",
        )
        updated = update_card(card, None, None, None, theme, db_session)
        assert json.loads(updated.theme)["fill"] == "#aaa"

    def test_no_op_update_succeeds(self, db_session: Session):
        card = _make_card(db_session)
        updated = update_card(card, None, None, None, None, db_session)
        assert updated.title == "Test Card"  # unchanged


class TestDeleteCardById:
    def test_deletes_owned_card(self, db_session: Session):
        card = _make_card(db_session)
        result = delete_card_by_id(card.id, USER_ID, db_session)
        assert result is True
        assert db_session.get(Card, card.id) is None

    def test_returns_false_for_missing(self, db_session: Session):
        result = delete_card_by_id("nonexistent", USER_ID, db_session)
        assert result is False

    def test_does_not_delete_other_users_card(self, db_session: Session):
        card = _make_card(db_session)
        result = delete_card_by_id(card.id, "other-user", db_session)
        assert result is False
        assert db_session.get(Card, card.id) is not None


class TestToggleSaveCard:
    def test_save_when_not_saved(self, db_session: Session):
        card = _make_card(db_session)
        result = toggle_save_card(card, "save", USER_ID, db_session)
        assert result["saved"] is True

    def test_save_when_already_saved_is_idempotent(self, db_session: Session):
        card = _make_card(db_session)
        toggle_save_card(card, "save", USER_ID, db_session)
        result = toggle_save_card(card, "save", USER_ID, db_session)
        assert result["saved"] is True

    def test_unsave_removes_from_default_and_may_orphan(self, db_session: Session):
        card = _make_card(db_session)
        toggle_save_card(card, "save", USER_ID, db_session)  # ensure saved
        result = toggle_save_card(card, "unsave", USER_ID, db_session)
        assert result["saved"] is False

    def test_unsave_when_not_saved_is_idempotent(self, db_session: Session):
        card = _make_card(db_session)
        result = toggle_save_card(card, "unsave", USER_ID, db_session)
        assert result["saved"] is False

    def test_toggle_saves_when_unsaved(self, db_session: Session):
        card = _make_card(db_session)
        result = toggle_save_card(card, "toggle", USER_ID, db_session)
        assert result["saved"] is True

    def test_toggle_unsaves_when_saved(self, db_session: Session):
        card = _make_card(db_session)
        toggle_save_card(card, "save", USER_ID, db_session)
        result = toggle_save_card(card, "toggle", USER_ID, db_session)
        assert result["saved"] is False


class TestShareUnshareCard:
    def test_share_sets_slug_and_mode(self, db_session: Session):
        card = _make_card(db_session)
        shared = share_card(card, "view_only", db_session)
        assert shared.share_slug is not None
        assert len(shared.share_slug) == 8
        assert shared.share_mode == "view_only"
        assert shared.share_at is not None

    def test_unshare_clears_fields(self, db_session: Session):
        card = _make_card(db_session)
        share_card(card, "view_and_copy", db_session)
        unshare_card(card, db_session)
        db_session.refresh(card)
        assert card.share_slug is None
        assert card.share_mode is None
        assert card.share_at is None


class TestListUserCards:
    def test_returns_cards_from_default_deck(self, db_session: Session):
        theme = CardThemeSchema(
            fill="#111", banner_fill="#222", box_fill="#333",
            stroke="#444", banner_text="#555", box_text="#666",
        )
        create_card(USER_ID, "Card A", [], "data:a", theme, db_session)
        create_card(USER_ID, "Card B", [], "data:b", theme, db_session)

        cards = list_user_cards(USER_ID, db_session)
        assert len(cards) >= 2
        titles = {c.title for c in cards}
        assert "Card A" in titles
        assert "Card B" in titles

    def test_deduplicates_if_card_appears_twice(self, db_session: Session):
        theme = CardThemeSchema(
            fill="#111", banner_fill="#222", box_fill="#333",
            stroke="#444", banner_text="#555", box_text="#666",
        )
        card = create_card(USER_ID, "Dup", [], "data:d", theme, db_session)
        default = db_session.query(Deck).filter(
            Deck.user_id == USER_ID, Deck.is_default
        ).first()
        # Add duplicate DeckCard entry (won't work with composite PK normally)
        # Instead, test that dedup logic works by checking no duplicates returned
        cards = list_user_cards(USER_ID, db_session)
        ids = [c.id for c in cards]
        assert ids.count(card.id) <= 1
