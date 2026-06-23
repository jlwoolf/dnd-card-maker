"""Unit tests for app/services/deck_service.py — deck business logic."""

import json

import pytest
from sqlalchemy.orm import Session

from app.models.card import Card
from app.models.deck import Deck, DeckCard
from app.schemas.card import CardThemeSchema
from app.services.deck_service import (
    count_user_cards_by_ids,
    create_deck_with_cards,
    delete_deck,
    get_autosave_deck,
    get_deck_by_id,
    get_deck_cards,
    get_shared_deck_by_slug,
    list_user_decks,
    save_autosave_deck,
    save_deck_with_cards,
    share_deck,
    unshare_deck,
    update_deck,
    upsert_deck_cards_batch,
)

USER_ID = "svc-d-user-1"


def _ensure_user(db: Session, user_id: str = USER_ID):
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
    _ensure_user(db_session, USER_ID)


def _make_theme_dict() -> dict:
    return {
        "fill": "#111", "banner_fill": "#222", "box_fill": "#333",
        "stroke": "#444", "banner_text": "#555", "box_text": "#666",
    }


def _make_card(db: Session, card_id: str, title: str = "Card") -> Card:
    card = Card(
        id=card_id, user_id=USER_ID, title=title,
        elements=json.dumps([{"type": "text"}]),
        img_url=f"data:image/png;base64,img-{card_id}",
        theme=json.dumps(_make_theme_dict()),
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


def _make_deck(db: Session, deck_id: str, title: str = "Deck",
               is_default: bool = False) -> Deck:
    deck = Deck(id=deck_id, user_id=USER_ID, title=title, is_default=is_default)
    db.add(deck)
    db.commit()
    return deck


def _add_cards_to_deck(db: Session, deck_id: str, *card_ids: str):
    for i, cid in enumerate(card_ids):
        db.add(DeckCard(deck_id=deck_id, card_id=cid, position=i))
    db.commit()


# ---------------------------------------------------------------------------
# get_deck_cards
# ---------------------------------------------------------------------------

class TestGetDeckCards:
    def test_empty_deck(self, db_session: Session):
        deck = _make_deck(db_session, "d-empty")
        cards = get_deck_cards(deck, db_session, include_saved=True)
        assert cards == []

    def test_populated_deck_excludes_img_url(self, db_session: Session):
        card = _make_card(db_session, "c-img")
        deck = _make_deck(db_session, "d-img")
        _add_cards_to_deck(db_session, "d-img", "c-img")

        cards = get_deck_cards(deck, db_session, include_saved=True)
        assert len(cards) == 1
        assert cards[0]["id"] == "c-img"
        assert "img_url" not in cards[0]

    def test_includes_saved_flag(self, db_session: Session):
        card = _make_card(db_session, "c-saved")
        deck = _make_deck(db_session, "d-saved")
        _add_cards_to_deck(db_session, "d-saved", "c-saved")

        # No default deck — saved should be False
        cards = get_deck_cards(deck, db_session, include_saved=True)
        assert cards[0]["saved"] is False

        # Add a default deck with the same card
        default = _make_deck(db_session, "d-default", is_default=True)
        _add_cards_to_deck(db_session, "d-default", "c-saved")
        cards = get_deck_cards(deck, db_session, include_saved=True)
        assert cards[0]["saved"] is True

    def test_includes_share_info(self, db_session: Session):
        card = _make_card(db_session, "c-share")
        card.share_slug = "abc12345"
        card.share_mode = "view_only"
        db_session.commit()

        deck = _make_deck(db_session, "d-share")
        _add_cards_to_deck(db_session, "d-share", "c-share")

        cards = get_deck_cards(deck, db_session, include_saved=True)
        assert cards[0]["share_slug"] == "abc12345"
        assert cards[0]["share_mode"] == "view_only"


# ---------------------------------------------------------------------------
# get_deck_cards
# ---------------------------------------------------------------------------

class TestGetDeckCardsForShare:
    def test_excludes_img_url(self, db_session: Session):
        card = _make_card(db_session, "c-sh-img")
        deck = _make_deck(db_session, "d-sh-img")
        _add_cards_to_deck(db_session, "d-sh-img", "c-sh-img")

        cards = get_deck_cards(deck, db_session, include_saved=False)
        assert len(cards) == 1
        assert "img_url" not in cards[0]

    def test_excludes_saved_flag(self, db_session: Session):
        card = _make_card(db_session, "c-sh-saved")
        deck = _make_deck(db_session, "d-sh-saved")
        default = _make_deck(db_session, "d-sh-def", is_default=True)
        _add_cards_to_deck(db_session, "d-sh-saved", "c-sh-saved")
        _add_cards_to_deck(db_session, "d-sh-def", "c-sh-saved")

        cards = get_deck_cards(deck, db_session, include_saved=False)
        assert "saved" not in cards[0]

    def test_empty_deck(self, db_session: Session):
        deck = _make_deck(db_session, "d-sh-empty")
        cards = get_deck_cards(deck, db_session, include_saved=False)
        assert cards == []


# ---------------------------------------------------------------------------
# list_user_decks
# ---------------------------------------------------------------------------

class TestListUserDecks:
    def test_lists_multiple_decks(self, db_session: Session):
        _make_deck(db_session, "dl1", "Alpha")
        _make_deck(db_session, "dl2", "Beta")
        decks = list_user_decks(USER_ID, db_session)
        assert len(decks) == 2
        titles = {d["title"] for d in decks}
        assert "Alpha" in titles
        assert "Beta" in titles

    def test_includes_card_count(self, db_session: Session):
        card1 = _make_card(db_session, "cc1")
        card2 = _make_card(db_session, "cc2")
        deck = _make_deck(db_session, "dl3")
        _add_cards_to_deck(db_session, "dl3", "cc1", "cc2")

        decks = list_user_decks(USER_ID, db_session)
        found = next(d for d in decks if d["id"] == "dl3")
        assert found["card_count"] == 2

    def test_default_deck_comes_first(self, db_session: Session):
        _make_deck(db_session, "d2")
        _make_deck(db_session, "d-default", is_default=True)
        decks = list_user_decks(USER_ID, db_session)
        assert decks[0]["is_default"] is True

    def test_includes_first_card_id(self, db_session: Session):
        card = _make_card(db_session, "cc-first")
        deck = _make_deck(db_session, "dl-first")
        _add_cards_to_deck(db_session, "dl-first", "cc-first")

        decks = list_user_decks(USER_ID, db_session)
        found = next(d for d in decks if d["id"] == "dl-first")
        assert found["first_card_id"] == "cc-first"

    def test_first_card_id_none_for_empty(self, db_session: Session):
        _make_deck(db_session, "dl-empty2")
        decks = list_user_decks(USER_ID, db_session)
        found = next(d for d in decks if d["id"] == "dl-empty2")
        assert found["first_card_id"] is None


# ---------------------------------------------------------------------------
# get_deck_by_id
# ---------------------------------------------------------------------------

class TestGetDeckById:
    def test_finds_owned_deck(self, db_session: Session):
        deck = _make_deck(db_session, "dg1")
        found = get_deck_by_id("dg1", USER_ID, db_session)
        assert found is not None
        assert found.id == "dg1"

    def test_returns_none_for_wrong_user(self, db_session: Session):
        deck = _make_deck(db_session, "dg2")
        assert get_deck_by_id("dg2", "other-user", db_session) is None

    def test_returns_none_for_missing(self, db_session: Session):
        assert get_deck_by_id("nonexistent", USER_ID, db_session) is None


# ---------------------------------------------------------------------------
# create_deck_with_cards
# ---------------------------------------------------------------------------

class TestCreateDeckWithCards:
    def test_creates_empty_deck(self, db_session: Session):
        deck = create_deck_with_cards(USER_ID, "Fresh", [], db_session)
        assert deck.id is not None
        assert deck.title == "Fresh"
        assert deck.is_default is False
        assert len(deck.deck_cards) == 0

    def test_creates_deck_with_cards(self, db_session: Session):
        card1 = _make_card(db_session, "cdc1")
        card2 = _make_card(db_session, "cdc2")
        deck = create_deck_with_cards(USER_ID, "With Cards", ["cdc1", "cdc2"], db_session)
        assert len(deck.deck_cards) == 2
        ids = {dc.card_id for dc in deck.deck_cards}
        assert ids == {"cdc1", "cdc2"}

    def test_card_positions_are_sequential(self, db_session: Session):
        card1 = _make_card(db_session, "pos1")
        card2 = _make_card(db_session, "pos2")
        deck = create_deck_with_cards(USER_ID, "Pos", ["pos1", "pos2"], db_session)
        positions = {dc.position: dc.card_id for dc in deck.deck_cards}
        assert positions[0] == "pos1"
        assert positions[1] == "pos2"


# ---------------------------------------------------------------------------
# update_deck
# ---------------------------------------------------------------------------

class TestUpdateDeck:
    def test_updates_title(self, db_session: Session):
        deck = _make_deck(db_session, "du1", "Old")
        updated = update_deck(deck, "New", None, USER_ID, db_session)
        assert updated.title == "New"

    def test_replaces_cards(self, db_session: Session):
        card1 = _make_card(db_session, "duc1")
        card2 = _make_card(db_session, "duc2")
        deck = _make_deck(db_session, "du2")
        _add_cards_to_deck(db_session, "du2", "duc1")

        updated = update_deck(deck, None, ["duc2"], USER_ID, db_session)
        card_ids = {dc.card_id for dc in updated.deck_cards}
        assert card_ids == {"duc2"}

    def test_no_changes_succeeds(self, db_session: Session):
        deck = _make_deck(db_session, "du3", "Stable")
        updated = update_deck(deck, None, None, USER_ID, db_session)
        assert updated.title == "Stable"

    def test_cleans_up_orphaned_cards_on_card_removal(self, db_session: Session):
        """When a card is removed from a deck and has no other deck refs, it's deleted."""
        card = _make_card(db_session, "orphan-test")
        deck = _make_deck(db_session, "du4")
        _add_cards_to_deck(db_session, "du4", "orphan-test")

        update_deck(deck, None, [], USER_ID, db_session)
        # Card should be orphaned unless still in default deck
        # If no default deck with this card, it's deleted
        orphaned = db_session.get(Card, "orphan-test")
        # It may survive if _cleanup_orphaned_card finds no refs — it should be deleted
        # But the card could also be in a default deck created earlier. We check directly.
        refs = db_session.query(DeckCard).filter(DeckCard.card_id == "orphan-test").count()
        if refs == 0:
            assert orphaned is None
        else:
            assert orphaned is not None


# ---------------------------------------------------------------------------
# save_deck_with_cards
# ---------------------------------------------------------------------------

class TestSaveDeckWithCards:
    def test_creates_new_deck_with_new_cards(self, db_session: Session):
        theme = CardThemeSchema(
            fill="#111", banner_fill="#222", box_fill="#333",
            stroke="#444", banner_text="#555", box_text="#666",
        )
        deck = save_deck_with_cards(
            USER_ID, "Saved Deck",
            [{"elements": [{"x": 1}], "img_url": "data:new", "theme": theme}],
            db_session,
        )
        assert deck.title == "Saved Deck"
        assert len(deck.deck_cards) == 1

    def test_updates_existing_deck_by_title(self, db_session: Session):
        theme = CardThemeSchema(
            fill="#111", banner_fill="#222", box_fill="#333",
            stroke="#444", banner_text="#555", box_text="#666",
        )
        first = save_deck_with_cards(
            USER_ID, "Reusable",
            [{"elements": [{"v": 1}], "img_url": "data:first", "theme": theme}],
            db_session, deck_id=None,  # uses title lookup
        )
        card_id = first.deck_cards[0].card_id

        # Use deck_id parameter for explicit lookup
        second = save_deck_with_cards(
            USER_ID, "Reusable",
            [{"id": card_id, "elements": [{"v": 2}], "img_url": "data:updated", "theme": theme}],
            db_session, deck_id=first.id,
        )
        assert second.id == first.id
        assert json.loads(db_session.get(Card, card_id).elements) == [{"v": 2}]

    def test_updates_existing_deck_by_deck_id(self, db_session: Session):
        deck = _make_deck(db_session, "d-explicit", "Explicit")
        theme = CardThemeSchema(
            fill="#111", banner_fill="#222", box_fill="#333",
            stroke="#444", banner_text="#555", box_text="#666",
        )
        result = save_deck_with_cards(
            USER_ID, "Explicit",
            [{"elements": [{"k": "v"}], "img_url": "data:e", "theme": theme}],
            db_session, deck_id="d-explicit",
        )
        assert result.id == "d-explicit"
        assert len(result.deck_cards) == 1


# ---------------------------------------------------------------------------
# delete_deck
# ---------------------------------------------------------------------------

class TestDeleteDeck:
    def test_deletes_deck(self, db_session: Session):
        deck = _make_deck(db_session, "dd1")
        delete_deck(deck, db_session)
        assert db_session.get(Deck, "dd1") is None

    def test_cleans_up_orphaned_cards(self, db_session: Session):
        card = _make_card(db_session, "orphan-del")
        deck = _make_deck(db_session, "dd2")
        _add_cards_to_deck(db_session, "dd2", "orphan-del")
        delete_deck(deck, db_session)
        # If no other deck references the card, it should be deleted
        refs = db_session.query(DeckCard).filter(
            DeckCard.card_id == "orphan-del"
        ).count()
        if refs == 0:
            assert db_session.get(Card, "orphan-del") is None


# ---------------------------------------------------------------------------
# upsert_deck_cards_batch
# ---------------------------------------------------------------------------

class TestUpsertDeckCardsBatch:
    def test_creates_new_cards_and_returns_ids(self, db_session: Session):
        theme = CardThemeSchema(
            fill="#111", banner_fill="#222", box_fill="#333",
            stroke="#444", banner_text="#555", box_text="#666",
        )
        ids = upsert_deck_cards_batch(
            USER_ID,
            [{"elements": [{"t": "a"}], "img_url": "data:a", "theme": theme}],
            db_session,
        )
        assert len(ids) == 1
        assert db_session.get(Card, ids[0]) is not None

    def test_updates_existing_card(self, db_session: Session):
        card = _make_card(db_session, "batch-upd")
        theme = CardThemeSchema(
            fill="#111", banner_fill="#222", box_fill="#333",
            stroke="#444", banner_text="#555", box_text="#666",
        )
        ids = upsert_deck_cards_batch(
            USER_ID,
            [{"id": "batch-upd", "elements": [{"updated": True}],
              "img_url": "data:new", "theme": theme}],
            db_session,
        )
        assert ids == ["batch-upd"]
        updated = db_session.get(Card, "batch-upd")
        assert json.loads(updated.elements) == [{"updated": True}]


# ---------------------------------------------------------------------------
# share / unshare deck
# ---------------------------------------------------------------------------

class TestShareUnshareDeck:
    def test_share_sets_slug_and_mode(self, db_session: Session):
        deck = _make_deck(db_session, "ds-share")
        shared = share_deck(deck, "view_and_copy", db_session)
        assert shared.share_slug is not None
        assert len(shared.share_slug) == 8
        assert shared.share_mode == "view_and_copy"

    def test_unshare_clears_fields(self, db_session: Session):
        deck = _make_deck(db_session, "ds-unshare")
        share_deck(deck, "view_only", db_session)
        unshare_deck(deck, db_session)
        db_session.refresh(deck)
        assert deck.share_slug is None
        assert deck.share_mode is None


# ---------------------------------------------------------------------------
# get_shared_deck_by_slug
# ---------------------------------------------------------------------------

class TestGetSharedDeckBySlug:
    def test_finds_shared_deck(self, db_session: Session):
        deck = _make_deck(db_session, "d-shared")
        share_deck(deck, "view_only", db_session)
        found = get_shared_deck_by_slug(deck.share_slug, db_session)
        assert found is not None
        assert found.id == "d-shared"

    def test_returns_none_for_unknown_slug(self, db_session: Session):
        assert get_shared_deck_by_slug("no-such-slg", db_session) is None


# ---------------------------------------------------------------------------
# count_user_cards_by_ids
# ---------------------------------------------------------------------------

class TestCountUserCardsByIds:
    def test_all_owned(self, db_session: Session):
        _make_card(db_session, "cnt1")
        _make_card(db_session, "cnt2")
        count = count_user_cards_by_ids(USER_ID, ["cnt1", "cnt2"], db_session)
        assert count == 2

    def test_partial(self, db_session: Session):
        _make_card(db_session, "cnt3")
        count = count_user_cards_by_ids(USER_ID, ["cnt3", "nonexistent"], db_session)
        assert count == 1

    def test_empty_list(self, db_session: Session):
        assert count_user_cards_by_ids(USER_ID, [], db_session) == 0


# ---------------------------------------------------------------------------
# Autosave deck
# ---------------------------------------------------------------------------

class TestAutosaveDeck:
    def test_get_autosave_returns_none_when_no_autosave(self, db_session: Session):
        """get_autosave_deck returns None when user has no autosave deck."""
        assert get_autosave_deck(USER_ID, db_session) is None

    def test_save_autosave_creates_new_deck(self, db_session: Session):
        """save_autosave_deck creates a new autosave deck when none exists."""
        c = _make_card(db_session, "auto-c1")
        deck = save_autosave_deck(
            USER_ID,
            [{"id": "auto-c1", "elements": c.elements, "img_url": c.img_url,
              "theme": CardThemeSchema.model_validate(json.loads(c.theme))}],
            db_session,
        )
        assert deck is not None
        assert deck.is_autosave is True
        assert not deck.is_default
        assert len(deck.deck_cards) == 1

    def test_save_autosave_updates_existing(self, db_session: Session):
        """save_autosave_deck updates cards on an existing autosave deck."""
        c1 = _make_card(db_session, "auto-up1")
        c2 = _make_card(db_session, "auto-up2")

        # First save with card 1
        deck1 = save_autosave_deck(
            USER_ID,
            [{"id": "auto-up1", "elements": c1.elements, "img_url": c1.img_url,
              "theme": CardThemeSchema.model_validate(json.loads(c1.theme))}],
            db_session,
        )
        deck1_id = deck1.id
        assert len(deck1.deck_cards) == 1

        # Second save with card 2 replaces card 1
        deck2 = save_autosave_deck(
            USER_ID,
            [{"id": "auto-up2", "elements": c2.elements, "img_url": c2.img_url,
              "theme": CardThemeSchema.model_validate(json.loads(c2.theme))}],
            db_session,
        )
        assert deck2.id == deck1_id  # same deck
        assert len(deck2.deck_cards) == 1
        assert deck2.deck_cards[0].card_id == "auto-up2"

    def test_autosave_not_listed_in_user_decks(self, db_session: Session):
        """list_user_decks does not include autosave decks."""
        # Create a regular deck
        create_deck_with_cards(USER_ID, "Normal Deck", [], db_session)

        # Create an autosave deck
        c = _make_card(db_session, "auto-hidden")
        save_autosave_deck(
            USER_ID,
            [{"id": "auto-hidden", "elements": c.elements, "img_url": c.img_url,
              "theme": CardThemeSchema.model_validate(json.loads(c.theme))}],
            db_session,
        )

        decks = list_user_decks(USER_ID, db_session)
        titles = [d["title"] for d in decks]
        assert "Normal Deck" in titles
        assert "__autosave__" not in titles

    def test_get_autosave_after_save(self, db_session: Session):
        """get_autosave_deck returns the deck after save_autosave_deck."""
        c = _make_card(db_session, "auto-c2")
        save_autosave_deck(
            USER_ID,
            [{"id": "auto-c2", "elements": c.elements, "img_url": c.img_url,
              "theme": CardThemeSchema.model_validate(json.loads(c.theme))}],
            db_session,
        )

        found = get_autosave_deck(USER_ID, db_session)
        assert found is not None
        assert found.is_autosave is True
        assert len(found.deck_cards) == 1

    def test_save_autosave_empty_cards(self, db_session: Session):
        """save_autosave_deck with empty cards creates an empty deck."""
        deck = save_autosave_deck(USER_ID, [], db_session)
        assert deck.is_autosave is True
        assert len(deck.deck_cards) == 0

    def test_get_autosave_user_isolation(self, db_session: Session):
        """get_autosave_deck only returns the requesting user's autosave."""
        c = _make_card(db_session, "auto-iso")
        save_autosave_deck(
            USER_ID,
            [{"id": "auto-iso", "elements": c.elements, "img_url": c.img_url,
              "theme": CardThemeSchema.model_validate(json.loads(c.theme))}],
            db_session,
        )

        # Another user should see no autosave
        assert get_autosave_deck("other-user-id", db_session) is None
