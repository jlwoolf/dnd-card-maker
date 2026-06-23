"""Unit tests for app/utils/ — shared, deck_helpers, and templates."""

import pytest
from sqlalchemy.orm import Session

from app.models.card import Card
from app.models.deck import Deck, DeckCard
from app.templates import render_template
from app.services.deck_service import (
    cleanup_orphaned_card,
    get_next_deck_position,
    get_or_create_default_deck,
)
from app.utils.shared import generate_share_slug


def _ensure_user(db: Session, user_id: str = "user-1"):
    """Create a test user if it doesn't already exist."""
    from app.models.user import User
    from app.services.auth import hash_password

    if db.query(User).filter(User.id == user_id).first():
        return
    user = User(
        id=user_id,
        email=f"{user_id}@test.example.com",
        password_hash=hash_password("testpass123"),
        is_verified=True,
    )
    db.add(user)
    db.commit()


@pytest.fixture(autouse=True)
def _auto_create_user(db_session: Session):
    """Ensure a test user record exists before every test."""
    _ensure_user(db_session)


class TestGenerateShareSlug:
    def test_returns_string(self):
        slug = generate_share_slug()
        assert isinstance(slug, str)

    def test_length_is_8(self):
        assert len(generate_share_slug()) == 8

    def test_url_safe(self):
        slug = generate_share_slug()
        assert "/" not in slug
        assert "+" not in slug
        assert "=" not in slug

    def test_unique_across_calls(self):
        slugs = {generate_share_slug() for _ in range(100)}
        assert len(slugs) == 100


class TestRenderTemplate:
    def test_single_variable(self):
        result = render_template("verify_email.html", verify_url="https://example.com/verify/abc")
        assert "https://example.com/verify/abc" in result

    def test_multiple_variables(self):
        # reset_email.html uses reset_url
        result = render_template("reset_email.html", reset_url="https://example.com/reset/xyz")
        assert "https://example.com/reset/xyz" in result

    def test_no_variable_placeholders_unaffected(self):
        # Template rendered with extra kwargs should still work
        result = render_template("verify_email.html", verify_url="https://example.com/v/1")
        assert "verify_url" not in result  # placeholder is replaced

    def test_missing_template_raises(self):
        import jinja2

        with pytest.raises(jinja2.exceptions.TemplateNotFound):
            render_template("nonexistent.html", var="val")


class TestDeckHelpers:
    def testget_or_create_default_deck_creates(self, db_session: Session):
        _ensure_user(db_session, "user-1")
        deck = get_or_create_default_deck("user-1", db_session)
        assert deck is not None
        assert deck.user_id == "user-1"
        assert deck.is_default is True
        assert deck.title == "My Cards"

    def testget_or_create_default_deck_returns_existing(self, db_session: Session):
        _ensure_user(db_session, "user-2")
        first = get_or_create_default_deck("user-2", db_session)
        second = get_or_create_default_deck("user-2", db_session)
        assert first.id == second.id

    def testcleanup_orphaned_card_deletes_if_no_refs(self, db_session: Session):
        _ensure_user(db_session, "u1")
        card = Card(id="card-orphan", user_id="u1", elements="[]", img_url="data:img", theme="{}")
        db_session.add(card)
        db_session.commit()
        cleanup_orphaned_card("card-orphan", db_session)
        db_session.commit()
        assert db_session.get(Card, "card-orphan") is None

    def testcleanup_orphaned_card_keeps_if_referenced(self, db_session: Session):
        _ensure_user(db_session, "u1")
        card = Card(id="card-keep", user_id="u1", elements="[]", img_url="data:img", theme="{}")
        deck = Deck(id="deck-1", user_id="u1", title="Test")
        dc = DeckCard(deck_id="deck-1", card_id="card-keep", position=0)
        db_session.add_all([card, deck, dc])
        db_session.commit()
        cleanup_orphaned_card("card-keep", db_session)
        db_session.commit()
        assert db_session.get(Card, "card-keep") is not None

    def test_get_next_deck_position_empty(self, db_session: Session):
        _ensure_user(db_session, "u1")
        deck = Deck(id="deck-empty", user_id="u1", title="Empty")
        db_session.add(deck)
        db_session.commit()
        assert get_next_deck_position("deck-empty", db_session) == 0

    def test_get_next_deck_position_sequential(self, db_session: Session):
        _ensure_user(db_session, "u1")
        card1 = Card(id="c1", user_id="u1", elements="[]", img_url="data:img", theme="{}")
        card2 = Card(id="c2", user_id="u1", elements="[]", img_url="data:img", theme="{}")
        deck = Deck(id="deck-pos", user_id="u1", title="Pos")
        db_session.add_all([card1, card2, deck])
        db_session.commit()
        db_session.add(DeckCard(deck_id="deck-pos", card_id="c1", position=0))
        db_session.add(DeckCard(deck_id="deck-pos", card_id="c2", position=1))
        db_session.commit()
        assert get_next_deck_position("deck-pos", db_session) == 2

    def test_get_next_deck_position_with_gap(self, db_session: Session):
        """Positions may have gaps if cards are deleted — still returns max+1."""
        _ensure_user(db_session, "u1")
        card = Card(id="c3", user_id="u1", elements="[]", img_url="data:img", theme="{}")
        deck = Deck(id="deck-gap", user_id="u1", title="Gap")
        db_session.add_all([card, deck])
        db_session.commit()
        db_session.add(DeckCard(deck_id="deck-gap", card_id="c3", position=5))
        db_session.commit()
        assert get_next_deck_position("deck-gap", db_session) == 6
