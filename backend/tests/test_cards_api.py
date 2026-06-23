"""API integration tests for /api/cards endpoints and toggle-save."""

from tests.conftest import TestSessionLocal


class TestCards:
    def test_create_card(self, client, auth_headers):
        response = client.post(
            "/api/cards",
            json={
                "title": "My Card",
                "elements": [{"id": "e1", "type": "text"}],
                "img_url": "data:image/png;base64,abc123",
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
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "My Card"
        assert data["img_url"] == "data:image/png;base64,abc123"
        assert data["share_slug"] is None

    def test_create_card_unauthorized(self, client):
        response = client.post(
            "/api/cards",
            json={
                "title": "No Auth",
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
        )
        assert response.status_code == 401

    def test_list_cards(self, client, auth_headers):
        # Create a card first
        client.post(
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

        response = client.get("/api/cards", headers=auth_headers)
        assert response.status_code == 200
        cards = response.json()
        assert isinstance(cards, list)
        assert len(cards) >= 1
        assert cards[0]["title"] == "Card 1"

    def test_list_cards_unauthorized(self, client):
        response = client.get("/api/cards")
        assert response.status_code == 401

    def test_get_card(self, client, auth_headers):
        create_resp = client.post(
            "/api/cards",
            json={
                "title": "Single Card",
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

        response = client.get(f"/api/cards/{card_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["img_url"] == "data:image/png;base64,test"

    def test_get_card_not_found(self, client, auth_headers):
        response = client.get("/api/cards/nonexistent-id", headers=auth_headers)
        assert response.status_code == 404

    def test_update_card(self, client, auth_headers):
        create_resp = client.post(
            "/api/cards",
            json={
                "title": "Original",
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

        response = client.put(
            f"/api/cards/{card_id}",
            json={
                "title": "Updated",
            },
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["title"] == "Updated"

    def test_delete_card(self, client, auth_headers):
        create_resp = client.post(
            "/api/cards",
            json={
                "title": "To Delete",
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

        response = client.delete(f"/api/cards/{card_id}", headers=auth_headers)
        assert response.status_code == 204

        # Verify it's gone
        get_resp = client.get(f"/api/cards/{card_id}", headers=auth_headers)
        assert get_resp.status_code == 404

    def test_cannot_access_other_users_card(self, client, auth_headers):
        # Create card as auth_headers user
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

        # Register a second user
        client.post(
            "/api/auth/register",
            json={
                "email": "other@example.com",
                "password": "testpass123",
            },
        )
        from app.database import SessionLocal
        from app.models.user import User

        db = SessionLocal()
        other_user = db.query(User).filter(User.email == "other@example.com").first()
        other_user.is_verified = True
        other_user.verify_token = None
        db.commit()
        db.close()

        other_login = client.post(
            "/api/auth/login",
            json={
                "email": "other@example.com",
                "password": "testpass123",
            },
        )
        other_token = other_login.json()["access_token"]
        other_headers = {"Authorization": f"Bearer {other_token}"}

        response = client.get(f"/api/cards/{card_id}", headers=other_headers)
        assert response.status_code == 404


class TestToggleSaveEdgeCases:
    """Edge cases for the toggle-save endpoint."""

    def test_toggle_saves_when_unsaved(self, client, auth_headers):
        card = client.post(
            "/api/cards",
            json={
                "title": "Toggle Me",
                "elements": [],
                "img_url": "data:image/png;base64,test",
                "theme": {
                    "fill": "#111111", "banner_fill": "#222222", "box_fill": "#333333",
                    "stroke": "#444444", "banner_text": "#555555", "box_text": "#666666",
                },
            },
            headers=auth_headers,
        )
        card_id = card.json()["id"]

        # Put card in a secondary deck so unsave doesn't orphan it
        deck = client.post("/api/decks", json={"title": "Safe", "card_ids": [card_id]}, headers=auth_headers)

        # Unsafe from default deck
        client.post(f"/api/cards/{card_id}/toggle-save", params={"action": "unsave"}, headers=auth_headers)

        # Now toggle should save it back
        resp = client.post(f"/api/cards/{card_id}/toggle-save", params={"action": "toggle"}, headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["saved"] is True
        assert data["message"] == "saved"

    def test_toggle_unsaves_when_saved(self, client, auth_headers):
        card = client.post(
            "/api/cards",
            json={
                "title": "Toggle Unsafe",
                "elements": [],
                "img_url": "data:image/png;base64,test",
                "theme": {
                    "fill": "#111111", "banner_fill": "#222222", "box_fill": "#333333",
                    "stroke": "#444444", "banner_text": "#555555", "box_text": "#666666",
                },
            },
            headers=auth_headers,
        )
        card_id = card.json()["id"]

        # Card is in default deck. Put in secondary deck so unsave doesn't orphan.
        client.post("/api/decks", json={"title": "Protect", "card_ids": [card_id]}, headers=auth_headers)

        resp = client.post(f"/api/cards/{card_id}/toggle-save", params={"action": "toggle"}, headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["saved"] is False
        assert resp.json()["message"] == "unsaved"

    def test_save_when_already_saved(self, client, auth_headers):
        card = client.post(
            "/api/cards",
            json={
                "title": "Double Save",
                "elements": [],
                "img_url": "data:image/png;base64,test",
                "theme": {
                    "fill": "#111111", "banner_fill": "#222222", "box_fill": "#333333",
                    "stroke": "#444444", "banner_text": "#555555", "box_text": "#666666",
                },
            },
            headers=auth_headers,
        )
        card_id = card.json()["id"]

        resp = client.post(f"/api/cards/{card_id}/toggle-save", params={"action": "save"}, headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["saved"] is True

    def test_unsave_when_not_saved(self, client, auth_headers):
        card = client.post(
            "/api/cards",
            json={
                "title": "Unsave Not Saved",
                "elements": [],
                "img_url": "data:image/png;base64,test",
                "theme": {
                    "fill": "#111111", "banner_fill": "#222222", "box_fill": "#333333",
                    "stroke": "#444444", "banner_text": "#555555", "box_text": "#666666",
                },
            },
            headers=auth_headers,
        )
        card_id = card.json()["id"]

        # Keep card alive in a secondary deck after unsave
        client.post("/api/decks", json={"title": "Keep Alive", "card_ids": [card_id]}, headers=auth_headers)
        # Remove from default deck
        client.post(f"/api/cards/{card_id}/toggle-save", params={"action": "unsave"}, headers=auth_headers)

        # Unsave again — should be idempotent
        resp = client.post(f"/api/cards/{card_id}/toggle-save", params={"action": "unsave"}, headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["saved"] is False

    def test_invalid_action_rejected(self, client, auth_headers):
        resp = client.post("/api/cards/fake-id/toggle-save?action=invalid", headers=auth_headers)
        assert resp.status_code == 422
