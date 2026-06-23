"""API integration tests for /api/decks endpoints — CRUD, save, share, batch, orphan cleanup, card-deck relationships."""

from tests.conftest import TestSessionLocal


class TestDeckCRUD:
    """Tests for deck create, read, update, and delete operations."""

    def test_create_deck(self, client, auth_headers):
        response = client.post(
            "/api/decks",
            json={"title": "Adventures", "card_ids": []},
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Adventures"
        assert not data["is_default"]
        assert data["cards"] == []

    def test_create_deck_with_cards(self, client, auth_headers):
        create_resp = client.post(
            "/api/cards",
            json={
                "title": "My Card",
                "elements": [],
                "img_url": "data:image/png;base64,test",
                "theme": {
                    "fill": "#111111",
                    "banner_fill": "#222222",
                    "box_fill": "#333333",
                    "stroke": "#444444",
                    "banner_text": "#555555",
                    "box_text": "#666666",
                },
            },
            headers=auth_headers,
        )
        card_id = create_resp.json()["id"]

        response = client.post(
            "/api/decks",
            json={"title": "My Deck", "card_ids": [card_id]},
            headers=auth_headers,
        )
        assert response.status_code == 201
        assert len(response.json()["cards"]) == 1

    def test_create_deck_invalid_card_ownership(self, client, auth_headers):
        """Reject creating a deck with cards that don't belong to the user."""
        response = client.post(
            "/api/decks",
            json={"title": "Stolen Deck", "card_ids": ["nonexistent-id"]},
            headers=auth_headers,
        )
        assert response.status_code == 400
        assert "do not belong to you" in response.json()["detail"]

    def test_list_decks(self, client, auth_headers):
        client.post(
            "/api/decks",
            json={"title": "Deck A", "card_ids": []},
            headers=auth_headers,
        )
        client.post(
            "/api/decks",
            json={"title": "Deck B", "card_ids": []},
            headers=auth_headers,
        )

        response = client.get("/api/decks", headers=auth_headers)
        assert response.status_code == 200
        decks = response.json()
        assert len(decks) >= 2
        titles = {d["title"] for d in decks}
        assert "Deck A" in titles
        assert "Deck B" in titles

    def test_get_deck(self, client, auth_headers):
        create_resp = client.post(
            "/api/decks",
            json={"title": "Specific Deck", "card_ids": []},
            headers=auth_headers,
        )
        deck_id = create_resp.json()["id"]

        response = client.get(f"/api/decks/{deck_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["title"] == "Specific Deck"

    def test_get_deck_not_found(self, client, auth_headers):
        response = client.get("/api/decks/nonexistent-id", headers=auth_headers)
        assert response.status_code == 404

    def test_update_deck_title(self, client, auth_headers):
        create_resp = client.post(
            "/api/decks",
            json={"title": "Old Title", "card_ids": []},
            headers=auth_headers,
        )
        deck_id = create_resp.json()["id"]

        response = client.put(
            f"/api/decks/{deck_id}",
            json={"title": "New Title"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["title"] == "New Title"

    def test_update_deck_cards(self, client, auth_headers):
        card1 = client.post(
            "/api/cards",
            json={
                "title": "Card 1",
                "elements": [],
                "img_url": "data:image/png;base64,test",
                "theme": {
                    "fill": "#111111",
                    "banner_fill": "#222222",
                    "box_fill": "#333333",
                    "stroke": "#444444",
                    "banner_text": "#555555",
                    "box_text": "#666666",
                },
            },
            headers=auth_headers,
        )
        card1_id = card1.json()["id"]

        deck = client.post(
            "/api/decks",
            json={"title": "Updatable", "card_ids": []},
            headers=auth_headers,
        )
        deck_id = deck.json()["id"]

        response = client.put(
            f"/api/decks/{deck_id}",
            json={"card_ids": [card1_id]},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert len(response.json()["cards"]) == 1

    def test_update_deck_invalid_card_ownership(self, client, auth_headers):
        deck = client.post(
            "/api/decks",
            json={"title": "Safe Deck", "card_ids": []},
            headers=auth_headers,
        )
        deck_id = deck.json()["id"]

        response = client.put(
            f"/api/decks/{deck_id}",
            json={"card_ids": ["nonexistent-id"]},
            headers=auth_headers,
        )
        assert response.status_code == 400
        assert "do not belong to you" in response.json()["detail"]

    def test_delete_deck(self, client, auth_headers):
        create_resp = client.post(
            "/api/decks",
            json={"title": "To Delete", "card_ids": []},
            headers=auth_headers,
        )
        deck_id = create_resp.json()["id"]

        response = client.delete(f"/api/decks/{deck_id}", headers=auth_headers)
        assert response.status_code == 204

        get_resp = client.get(f"/api/decks/{deck_id}", headers=auth_headers)
        assert get_resp.status_code == 404

    def test_cannot_delete_default_deck(self, client, auth_headers):
        # Default deck is created when first card is made
        client.post(
            "/api/cards",
            json={
                "title": "Trigger Default",
                "elements": [],
                "img_url": "data:image/png;base64,test",
                "theme": {
                    "fill": "#111111",
                    "banner_fill": "#222222",
                    "box_fill": "#333333",
                    "stroke": "#444444",
                    "banner_text": "#555555",
                    "box_text": "#666666",
                },
            },
            headers=auth_headers,
        )

        decks = client.get("/api/decks", headers=auth_headers).json()
        default = next(d for d in decks if d["is_default"])

        response = client.delete(f"/api/decks/{default['id']}", headers=auth_headers)
        assert response.status_code == 400
        assert "Cannot delete default deck" in response.json()["detail"]

    def test_cannot_access_other_users_deck(self, client, auth_headers):
        create_resp = client.post(
            "/api/decks",
            json={"title": "Private Deck", "card_ids": []},
            headers=auth_headers,
        )
        deck_id = create_resp.json()["id"]

        # Register a second user
        client.post(
            "/api/auth/register",
            json={"email": "other-deck@example.com", "password": "testpass123"},
        )
        db = TestSessionLocal()
        try:
            from app.models.user import User

            other = db.query(User).filter(User.email == "other-deck@example.com").first()
            other.is_verified = True
            other.verify_token = None
            db.commit()
        finally:
            db.close()

        login_resp = client.post(
            "/api/auth/login",
            json={"email": "other-deck@example.com", "password": "testpass123"},
        )
        other_headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

        response = client.get(f"/api/decks/{deck_id}", headers=other_headers)
        assert response.status_code == 404


class TestDeckSave:
    """Tests for the /api/decks/save endpoint."""

    def test_save_deck_new_cards(self, client, auth_headers):
        response = client.post(
            "/api/decks/save",
            json={
                "title": "Saved Deck",
                "cards": [
                    {
                        "elements": [{"id": "e1", "type": "text"}],
                        "img_url": "data:image/png;base64,abc",
                        "theme": {
                            "fill": "#111",
                            "banner_fill": "#222",
                            "box_fill": "#333",
                            "stroke": "#444",
                            "banner_text": "#555",
                            "box_text": "#666",
                        },
                    }
                ],
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Saved Deck"
        assert len(data["cards"]) == 1

    def test_save_deck_update_existing(self, client, auth_headers):
        first = client.post(
            "/api/decks/save",
            json={
                "title": "Reusable Deck",
                "cards": [
                    {
                        "elements": [{"id": "e1"}],
                        "img_url": "data:image/png;base64,first",
                        "theme": {
                            "fill": "#111",
                            "banner_fill": "#222",
                            "box_fill": "#333",
                            "stroke": "#444",
                            "banner_text": "#555",
                            "box_text": "#666",
                        },
                    }
                ],
            },
            headers=auth_headers,
        )
        card_id = first.json()["cards"][0]["id"]

        second = client.post(
            "/api/decks/save",
            json={
                "title": "Reusable Deck",
                "cards": [
                    {
                        "id": card_id,
                        "elements": [{"id": "e1", "updated": True}],
                        "img_url": "data:image/png;base64,updated",
                        "theme": {
                            "fill": "#aaa",
                            "banner_fill": "#bbb",
                            "box_fill": "#ccc",
                            "stroke": "#ddd",
                            "banner_text": "#eee",
                            "box_text": "#fff",
                        },
                    }
                ],
            },
            headers=auth_headers,
        )
        assert second.status_code == 201
        assert second.json()["cards"][0]["elements"] == [{"id": "e1", "updated": True}]


class TestDeckShare:
    """Tests for deck sharing and shared deck viewing."""

    def test_share_deck(self, client, auth_headers):
        deck = client.post(
            "/api/decks",
            json={"title": "Shareable", "card_ids": []},
            headers=auth_headers,
        )
        deck_id = deck.json()["id"]

        response = client.post(
            f"/api/decks/{deck_id}/share",
            json={"mode": "view_and_copy"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["share_slug"] is not None
        assert data["share_mode"] == "view_and_copy"

    def test_share_deck_invalid_mode(self, client, auth_headers):
        deck = client.post(
            "/api/decks",
            json={"title": "Bad Share", "card_ids": []},
            headers=auth_headers,
        )
        deck_id = deck.json()["id"]

        response = client.post(
            f"/api/decks/{deck_id}/share",
            json={"mode": "invalid_mode"},
            headers=auth_headers,
        )
        assert response.status_code == 422

    def test_unshare_deck(self, client, auth_headers):
        deck = client.post(
            "/api/decks",
            json={"title": "Unshare Me", "card_ids": []},
            headers=auth_headers,
        )
        deck_id = deck.json()["id"]

        client.post(
            f"/api/decks/{deck_id}/share",
            json={"mode": "view_only"},
            headers=auth_headers,
        )

        response = client.delete(f"/api/decks/{deck_id}/share", headers=auth_headers)
        assert response.status_code == 204

        check = client.get(f"/api/decks/{deck_id}", headers=auth_headers)
        assert check.json()["share_slug"] is None

    def test_view_shared_deck_public(self, client, auth_headers):
        deck = client.post(
            "/api/decks",
            json={"title": "Public Deck", "card_ids": []},
            headers=auth_headers,
        )
        deck_id = deck.json()["id"]

        share = client.post(
            f"/api/decks/{deck_id}/share",
            json={"mode": "view_and_copy"},
            headers=auth_headers,
        )
        slug = share.json()["share_slug"]

        response = client.get(f"/api/shared/decks/{slug}")
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Public Deck"
        assert data["can_copy"] is True

    def test_view_shared_deck_not_found(self, client):
        response = client.get("/api/shared/decks/nonexistent-slug")
        assert response.status_code == 404


class TestOrphanCleanup:
    """Tests for orphaned card cleanup logic."""

    def test_card_removed_when_removed_from_all_decks(self, client, auth_headers):
        card = client.post(
            "/api/cards",
            json={
                "title": "Orphan Me",
                "elements": [],
                "img_url": "data:image/png;base64,test",
                "theme": {
                    "fill": "#111111",
                    "banner_fill": "#222222",
                    "box_fill": "#333333",
                    "stroke": "#444444",
                    "banner_text": "#555555",
                    "box_text": "#666666",
                },
            },
            headers=auth_headers,
        )
        card_id = card.json()["id"]

        deck = client.post(
            "/api/decks",
            json={"title": "Temp Deck", "card_ids": [card_id]},
            headers=auth_headers,
        )
        deck_id = deck.json()["id"]

        # Remove card from deck by updating deck cards to empty
        client.put(
            f"/api/decks/{deck_id}",
            json={"card_ids": []},
            headers=auth_headers,
        )
        # Unsafe from default deck too
        client.post(
            f"/api/cards/{card_id}/toggle-save",
            params={"action": "unsave"},
            headers=auth_headers,
        )

        # Card should be orphaned and cleaned up
        response = client.get(f"/api/cards/{card_id}", headers=auth_headers)
        assert response.status_code == 404


class TestCardDecks:
    """Tests for card-to-deck relationship endpoints."""

    def test_get_card_decks(self, client, auth_headers):
        card = client.post(
            "/api/cards",
            json={
                "title": "Multi Deck Card",
                "elements": [],
                "img_url": "data:image/png;base64,test",
                "theme": {
                    "fill": "#111111",
                    "banner_fill": "#222222",
                    "box_fill": "#333333",
                    "stroke": "#444444",
                    "banner_text": "#555555",
                    "box_text": "#666666",
                },
            },
            headers=auth_headers,
        )
        card_id = card.json()["id"]

        response = client.get(f"/api/cards/{card_id}/decks", headers=auth_headers)
        assert response.status_code == 200
        decks = response.json()
        # Card is automatically added to default deck on creation
        assert len(decks) >= 1
        assert any(d["is_default"] for d in decks)

    def test_update_card_decks(self, client, auth_headers):
        card = client.post(
            "/api/cards",
            json={
                "title": "Reassignable",
                "elements": [],
                "img_url": "data:image/png;base64,test",
                "theme": {
                    "fill": "#111111",
                    "banner_fill": "#222222",
                    "box_fill": "#333333",
                    "stroke": "#444444",
                    "banner_text": "#555555",
                    "box_text": "#666666",
                },
            },
            headers=auth_headers,
        )
        card_id = card.json()["id"]

        new_deck = client.post(
            "/api/decks",
            json={"title": "Target Deck", "card_ids": []},
            headers=auth_headers,
        )
        deck_id = new_deck.json()["id"]

        response = client.put(
            f"/api/cards/{card_id}/decks",
            json={"deck_ids": [deck_id]},
            headers=auth_headers,
        )
        assert response.status_code == 204

        decks = client.get(f"/api/cards/{card_id}/decks", headers=auth_headers).json()
        assert len(decks) == 1
        assert decks[0]["deck_id"] == deck_id


class TestDeckSaveBatch:
    """Tests for POST /api/decks/save/cards (batch card upload)."""

    def test_batch_upload_returns_card_ids(self, client, auth_headers):
        resp = client.post(
            "/api/decks/save/cards",
            json={
                "cards": [
                    {
                        "elements": [{"id": "e1"}],
                        "img_url": "data:image/png;base64,batch1",
                        "theme": {
                            "fill": "#111", "banner_fill": "#222", "box_fill": "#333",
                            "stroke": "#444", "banner_text": "#555", "box_text": "#666",
                        },
                    },
                    {
                        "elements": [{"id": "e2"}],
                        "img_url": "data:image/png;base64,batch2",
                        "theme": {
                            "fill": "#aaa", "banner_fill": "#bbb", "box_fill": "#ccc",
                            "stroke": "#ddd", "banner_text": "#eee", "box_text": "#fff",
                        },
                    },
                ],
            },
            headers=auth_headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert len(data["card_ids"]) == 2

    def test_batch_upload_creates_cards(self, client, auth_headers):
        resp = client.post(
            "/api/decks/save/cards",
            json={
                "cards": [
                    {
                        "elements": [{"type": "text"}],
                        "img_url": "data:image/png;base64,batch-create",
                        "theme": {
                            "fill": "#111", "banner_fill": "#222", "box_fill": "#333",
                            "stroke": "#444", "banner_text": "#555", "box_text": "#666",
                        },
                    },
                ],
            },
            headers=auth_headers,
        )
        card_ids = resp.json()["card_ids"]
        # Verify cards exist
        card = client.get(f"/api/cards/{card_ids[0]}", headers=auth_headers)
        assert card.status_code == 200
        assert card.json()["elements"] == [{"type": "text"}]


class TestDeckSaveWithCardIds:
    """Tests for deck save using card_ids mode (no cards_input)."""

    def test_save_deck_with_existing_card_ids(self, client, auth_headers):
        card1 = client.post(
            "/api/cards",
            json={
                "title": "Card A",
                "elements": [],
                "img_url": "data:image/png;base64,a",
                "theme": {
                    "fill": "#111111", "banner_fill": "#222222", "box_fill": "#333333",
                    "stroke": "#444444", "banner_text": "#555555", "box_text": "#666666",
                },
            },
            headers=auth_headers,
        )
        card2 = client.post(
            "/api/cards",
            json={
                "title": "Card B",
                "elements": [],
                "img_url": "data:image/png;base64,b",
                "theme": {
                    "fill": "#111111", "banner_fill": "#222222", "box_fill": "#333333",
                    "stroke": "#444444", "banner_text": "#555555", "box_text": "#666666",
                },
            },
            headers=auth_headers,
        )

        resp = client.post(
            "/api/decks/save",
            json={
                "title": "Card ID Deck",
                "cards": None,
                "card_ids": [card1.json()["id"], card2.json()["id"]],
            },
            headers=auth_headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Card ID Deck"
        assert len(data["cards"]) == 2


class TestDeckUpdateNoChanges:
    """Tests for deck update with no fields provided."""

    def test_update_deck_with_no_fields_succeeds(self, client, auth_headers):
        deck = client.post(
            "/api/decks",
            json={"title": "No Change Deck", "card_ids": []},
            headers=auth_headers,
        )
        deck_id = deck.json()["id"]

        resp = client.put(
            f"/api/decks/{deck_id}",
            json={},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["title"] == "No Change Deck"


class TestAutosaveEndpoints:
    """Tests for GET/PUT /api/decks/autosave."""

    def test_get_autosave_empty(self, client, auth_headers):
        """GET /api/decks/autosave returns null when no autosave exists."""
        resp = client.get("/api/decks/autosave", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json() is None

    def test_put_autosave_creates(self, client, auth_headers):
        """PUT /api/decks/autosave creates an autosave deck with cards."""
        resp = client.put(
            "/api/decks/autosave",
            json={
                "cards": [
                    {
                        "elements": [],
                        "img_url": "data:image/png;base64,abc",
                        "theme": {
                            "fill": "#111111",
                            "banner_fill": "#222222",
                            "box_fill": "#333333",
                            "stroke": "#444444",
                            "banner_text": "#555555",
                            "box_text": "#666666",
                        },
                    }
                ]
            },
            headers=auth_headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "__autosave__"
        assert len(data["cards"]) == 1

    def test_put_then_get_autosave(self, client, auth_headers):
        """Saving then fetching autosave returns the same cards."""
        client.put(
            "/api/decks/autosave",
            json={
                "cards": [
                    {
                        "elements": [{"type": "paragraph", "children": [{"text": "Hello"}]}],
                        "img_url": "data:image/png;base64,xyz",
                        "theme": {
                            "fill": "#aaaaaa",
                            "banner_fill": "#bbbbbb",
                            "box_fill": "#cccccc",
                            "stroke": "#dddddd",
                            "banner_text": "#eeeeee",
                            "box_text": "#ffffff",
                        },
                    }
                ]
            },
            headers=auth_headers,
        )

        resp = client.get("/api/decks/autosave", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data is not None
        assert len(data["cards"]) == 1
        assert data["cards"][0]["elements"] == [{"type": "paragraph", "children": [{"text": "Hello"}]}]

    def test_autosave_not_in_deck_list(self, client, auth_headers):
        """Autosave deck should not appear in GET /api/decks."""
        # Create autosave deck
        client.put(
            "/api/decks/autosave",
            json={
                "cards": [
                    {
                        "elements": [],
                        "img_url": "data:image/png;base64,zzz",
                        "theme": {
                            "fill": "#111111",
                            "banner_fill": "#222222",
                            "box_fill": "#333333",
                            "stroke": "#444444",
                            "banner_text": "#555555",
                            "box_text": "#666666",
                        },
                    }
                ]
            },
            headers=auth_headers,
        )

        # Create a regular deck
        client.post(
            "/api/decks",
            json={"title": "Visible Deck", "card_ids": []},
            headers=auth_headers,
        )

        resp = client.get("/api/decks", headers=auth_headers)
        decks = resp.json()
        titles = [d["title"] for d in decks]
        assert "Visible Deck" in titles
        assert "__autosave__" not in titles

    def test_put_autosave_overwrites(self, client, auth_headers):
        """Putting autosave twice overwrites the cards."""
        client.put(
            "/api/decks/autosave",
            json={
                "cards": [
                    {
                        "elements": [],
                        "img_url": "data:image/png;base64,abc",
                        "theme": {
                            "fill": "#111111",
                            "banner_fill": "#222222",
                            "box_fill": "#333333",
                            "stroke": "#444444",
                            "banner_text": "#555555",
                            "box_text": "#666666",
                        },
                    }
                ]
            },
            headers=auth_headers,
        )

        # Overwrite with different cards
        resp = client.put(
            "/api/decks/autosave",
            json={
                "cards": [
                    {
                        "elements": [{"text": "New"}],
                        "img_url": "data:image/png;base64,def",
                        "theme": {
                            "fill": "#999999",
                            "banner_fill": "#888888",
                            "box_fill": "#777777",
                            "stroke": "#666666",
                            "banner_text": "#555555",
                            "box_text": "#444444",
                        },
                    }
                ]
            },
            headers=auth_headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert len(data["cards"]) == 1
        assert data["cards"][0]["elements"] == [{"text": "New"}]

    def test_autosave_user_isolation(self, client, auth_headers, other_auth_headers):
        """Each user has their own autosave deck."""
        client.put(
            "/api/decks/autosave",
            json={
                "cards": [
                    {
                        "elements": [{"text": "User A"}],
                        "img_url": "data:image/png;base64,aaa",
                        "theme": {
                            "fill": "#111111",
                            "banner_fill": "#222222",
                            "box_fill": "#333333",
                            "stroke": "#444444",
                            "banner_text": "#555555",
                            "box_text": "#666666",
                        },
                    }
                ]
            },
            headers=auth_headers,
        )

        # Other user should see no autosave
        resp = client.get("/api/decks/autosave", headers=other_auth_headers)
        assert resp.json() is None
