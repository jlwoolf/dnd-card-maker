"""API integration tests for the DnD Card Maker backend."""

from tests.conftest import TestSessionLocal


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_docs_available(client):
    response = client.get("/docs")
    assert response.status_code == 200


class TestAuth:
    def test_register_success(self, client):
        response = client.post(
            "/api/auth/register",
            json={
                "email": "newuser@example.com",
                "password": "securepass123",
            },
        )
        assert response.status_code == 201
        assert "Registration successful" in response.json()["message"]

    def test_register_duplicate_email(self, client):
        client.post(
            "/api/auth/register",
            json={
                "email": "dup@example.com",
                "password": "securepass123",
            },
        )
        response = client.post(
            "/api/auth/register",
            json={
                "email": "dup@example.com",
                "password": "another123",
            },
        )
        assert response.status_code == 409
        assert "already registered" in response.json()["detail"]

    def test_register_invalid_email(self, client):
        response = client.post(
            "/api/auth/register",
            json={
                "email": "not-an-email",
                "password": "securepass123",
            },
        )
        assert response.status_code == 422

    def test_register_short_password(self, client):
        response = client.post(
            "/api/auth/register",
            json={
                "email": "short@example.com",
                "password": "ab",
            },
        )
        assert response.status_code == 422

    def test_verify_email(self, client):
        client.post(
            "/api/auth/register",
            json={
                "email": "verify-me@example.com",
                "password": "securepass123",
            },
        )

        from app.database import SessionLocal
        from app.models.user import User

        db = SessionLocal()
        token = db.query(User).filter(User.email == "verify-me@example.com").first().verify_token
        db.close()

        response = client.get(f"/api/auth/verify/{token}")
        assert response.status_code == 200
        assert "verified" in response.json()["message"]

    def test_verify_invalid_token(self, client):
        response = client.get("/api/auth/verify/nonexistent-token")
        assert response.status_code == 404

    def test_login_success(self, client):
        client.post(
            "/api/auth/register",
            json={
                "email": "login-test@example.com",
                "password": "securepass123",
            },
        )
        from app.database import SessionLocal
        from app.models.user import User

        db = SessionLocal()
        user = db.query(User).filter(User.email == "login-test@example.com").first()
        user.is_verified = True
        user.verify_token = None
        db.commit()
        db.close()

        response = client.post(
            "/api/auth/login",
            json={
                "email": "login-test@example.com",
                "password": "securepass123",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client):
        client.post(
            "/api/auth/register",
            json={
                "email": "wrong-pass@example.com",
                "password": "securepass123",
            },
        )
        from app.database import SessionLocal
        from app.models.user import User

        db = SessionLocal()
        user = db.query(User).filter(User.email == "wrong-pass@example.com").first()
        user.is_verified = True
        user.verify_token = None
        db.commit()
        db.close()

        response = client.post(
            "/api/auth/login",
            json={
                "email": "wrong-pass@example.com",
                "password": "wrongpassword",
            },
        )
        assert response.status_code == 401

    def test_login_unverified(self, client):
        client.post(
            "/api/auth/register",
            json={
                "email": "unverified@example.com",
                "password": "securepass123",
            },
        )

        response = client.post(
            "/api/auth/login",
            json={
                "email": "unverified@example.com",
                "password": "securepass123",
            },
        )
        assert response.status_code == 403
        assert "not verified" in response.json()["detail"]

    def test_refresh_token(self, client):
        client.post(
            "/api/auth/register",
            json={
                "email": "refresh@example.com",
                "password": "securepass123",
            },
        )
        from app.database import SessionLocal
        from app.models.user import User

        db = SessionLocal()
        user = db.query(User).filter(User.email == "refresh@example.com").first()
        user.is_verified = True
        user.verify_token = None
        db.commit()
        db.close()

        login_resp = client.post(
            "/api/auth/login",
            json={
                "email": "refresh@example.com",
                "password": "securepass123",
            },
        )
        refresh_token = login_resp.json()["refresh_token"]

        response = client.post(
            "/api/auth/refresh",
            json={
                "refresh_token": refresh_token,
            },
        )
        assert response.status_code == 200
        assert "access_token" in response.json()

    def test_refresh_invalid_token(self, client):
        response = client.post(
            "/api/auth/refresh",
            json={
                "refresh_token": "invalid-token",
            },
        )
        assert response.status_code == 401

    def test_forgot_password(self, client):
        client.post(
            "/api/auth/register",
            json={
                "email": "forgot@example.com",
                "password": "securepass123",
            },
        )
        from app.database import SessionLocal
        from app.models.user import User

        db = SessionLocal()
        user = db.query(User).filter(User.email == "forgot@example.com").first()
        user.is_verified = True
        user.verify_token = None
        db.commit()
        db.close()

        response = client.post(
            "/api/auth/forgot-password",
            json={
                "email": "forgot@example.com",
            },
        )
        assert response.status_code == 200

    def test_forgot_password_nonexistent(self, client):
        response = client.post(
            "/api/auth/forgot-password",
            json={
                "email": "noone@example.com",
            },
        )
        assert response.status_code == 200  # Don't reveal existence

    def test_reset_password(self, client):
        client.post(
            "/api/auth/register",
            json={
                "email": "reset@example.com",
                "password": "oldpass123",
            },
        )
        from app.database import SessionLocal
        from app.models.user import User

        db = SessionLocal()
        user = db.query(User).filter(User.email == "reset@example.com").first()
        user.is_verified = True
        user.verify_token = None
        db.commit()

        client.post("/api/auth/forgot-password", json={"email": "reset@example.com"})
        db.refresh(user)
        reset_token = user.reset_token
        db.close()

        response = client.post(
            f"/api/auth/reset-password/{reset_token}",
            json={
                "password": "newpass456",
            },
        )
        assert response.status_code == 200

        # Verify can login with new password
        login_resp = client.post(
            "/api/auth/login",
            json={
                "email": "reset@example.com",
                "password": "newpass456",
            },
        )
        assert login_resp.status_code == 200

    def test_reset_password_invalid_token(self, client):
        response = client.post(
            "/api/auth/reset-password/bad-token",
            json={
                "password": "newpass456",
            },
        )
        assert response.status_code == 404


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


class TestShare:
    def test_share_card(self, client, auth_headers):
        create_resp = client.post(
            "/api/cards",
            json={
                "title": "Share Me",
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
            f"/api/cards/{card_id}/share",
            json={
                "mode": "view_and_copy",
            },
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["share_slug"] is not None
        assert data["share_mode"] == "view_and_copy"

    def test_share_card_invalid_mode(self, client, auth_headers):
        create_resp = client.post(
            "/api/cards",
            json={
                "title": "Bad Mode",
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
            f"/api/cards/{card_id}/share",
            json={
                "mode": "invalid_mode",
            },
            headers=auth_headers,
        )
        assert response.status_code == 422

    def test_unshare_card(self, client, auth_headers):
        create_resp = client.post(
            "/api/cards",
            json={
                "title": "Unshare Me",
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

        client.post(
            f"/api/cards/{card_id}/share",
            json={
                "mode": "view_only",
            },
            headers=auth_headers,
        )

        response = client.delete(f"/api/cards/{card_id}/share", headers=auth_headers)
        assert response.status_code == 204

        # Verify unshared
        card = client.get(f"/api/cards/{card_id}", headers=auth_headers)
        assert card.json()["share_slug"] is None

    def test_view_shared_card_view_only(self, client, auth_headers):
        create_resp = client.post(
            "/api/cards",
            json={
                "title": "Public View Only",
                "elements": [{"id": "e1", "type": "text"}],
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

        share_resp = client.post(
            f"/api/cards/{card_id}/share",
            json={
                "mode": "view_only",
            },
            headers=auth_headers,
        )
        slug = share_resp.json()["share_slug"]

        response = client.get(f"/api/shared/{slug}")
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Public View Only"
        assert data["can_copy"] is False

    def test_view_shared_card_view_and_copy(self, client, auth_headers):
        create_resp = client.post(
            "/api/cards",
            json={
                "title": "Public Copyable",
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

        share_resp = client.post(
            f"/api/cards/{card_id}/share",
            json={
                "mode": "view_and_copy",
            },
            headers=auth_headers,
        )
        slug = share_resp.json()["share_slug"]

        response = client.get(f"/api/shared/{slug}")
        assert response.status_code == 200
        assert response.json()["can_copy"] is True

    def test_view_shared_card_not_found(self, client):
        response = client.get("/api/shared/nonexistent-slug")
        assert response.status_code == 404

    def test_view_shared_card_different_user(self, client, auth_headers):
        # Create and share as auth_headers user
        create_resp = client.post(
            "/api/cards",
            json={
                "title": "Cross User",
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

        share_resp = client.post(
            f"/api/cards/{card_id}/share",
            json={
                "mode": "view_and_copy",
            },
            headers=auth_headers,
        )
        slug = share_resp.json()["share_slug"]

        # Another user (unauthenticated) can view it
        response = client.get(f"/api/shared/{slug}")
        assert response.status_code == 200
        assert response.json()["title"] == "Cross User"


class TestDevMail:
    def _get_auth_headers(self, client, email, password="testpass123"):
        """Helper to register, verify, and login a user for dev mail tests."""
        client.post(
            "/api/auth/register",
            json={"email": email, "password": password},
        )
        db = TestSessionLocal()
        try:
            from app.models.user import User

            user = db.query(User).filter(User.email == email).first()
            user.is_verified = True
            user.verify_token = None
            db.commit()
        finally:
            db.close()

        login_resp = client.post(
            "/api/auth/login",
            json={"email": email, "password": password},
        )
        token = login_resp.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}

    def test_list_mail(self, client):
        headers = self._get_auth_headers(client, "devmail@example.com")
        response = client.get("/api/dev/mail", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert "subject" in data[0]
        assert "to_email" in data[0]

    def test_mail_contains_registration_emails(self, client):
        headers = self._get_auth_headers(client, "devmail2@example.com")
        response = client.get("/api/dev/mail", headers=headers)
        emails = response.json()
        subjects = [e["subject"] for e in emails]
        assert any("Verify your DnD Card Maker account" in s for s in subjects)

    def test_get_single_mail(self, client):
        headers = self._get_auth_headers(client, "devmail3@example.com")
        list_resp = client.get("/api/dev/mail", headers=headers)
        email_id = list_resp.json()[0]["id"]

        response = client.get(f"/api/dev/mail/{email_id}", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "html_body" in data
        assert len(data["html_body"]) > 0

    def test_get_mail_not_found(self, client):
        headers = self._get_auth_headers(client, "devmail-nf@example.com")
        response = client.get("/api/dev/mail/nonexistent-id", headers=headers)
        assert response.status_code == 404

    def test_clear_mail(self, client):
        headers = self._get_auth_headers(client, "devmail4@example.com")
        response = client.delete("/api/dev/mail", headers=headers)
        assert response.status_code == 204

        list_resp = client.get("/api/dev/mail", headers=headers)
        assert list_resp.json() == []


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
