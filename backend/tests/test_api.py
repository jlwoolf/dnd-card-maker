def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_docs_available(client):
    response = client.get("/docs")
    assert response.status_code == 200


class TestAuth:
    def test_register_success(self, client):
        response = client.post("/api/auth/register", json={
            "email": "newuser@example.com",
            "password": "securepass123",
        })
        assert response.status_code == 200
        assert "Registration successful" in response.json()["message"]

    def test_register_duplicate_email(self, client):
        client.post("/api/auth/register", json={
            "email": "dup@example.com",
            "password": "securepass123",
        })
        response = client.post("/api/auth/register", json={
            "email": "dup@example.com",
            "password": "another123",
        })
        assert response.status_code == 409
        assert "already registered" in response.json()["detail"]

    def test_register_invalid_email(self, client):
        response = client.post("/api/auth/register", json={
            "email": "not-an-email",
            "password": "securepass123",
        })
        assert response.status_code == 422

    def test_register_short_password(self, client):
        response = client.post("/api/auth/register", json={
            "email": "short@example.com",
            "password": "ab",
        })
        assert response.status_code == 422

    def test_verify_email(self, client):
        client.post("/api/auth/register", json={
            "email": "verify-me@example.com",
            "password": "securepass123",
        })

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
        client.post("/api/auth/register", json={
            "email": "login-test@example.com",
            "password": "securepass123",
        })
        from app.database import SessionLocal
        from app.models.user import User
        db = SessionLocal()
        user = db.query(User).filter(User.email == "login-test@example.com").first()
        user.is_verified = True
        user.verify_token = None
        db.commit()
        db.close()

        response = client.post("/api/auth/login", json={
            "email": "login-test@example.com",
            "password": "securepass123",
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client):
        client.post("/api/auth/register", json={
            "email": "wrong-pass@example.com",
            "password": "securepass123",
        })
        from app.database import SessionLocal
        from app.models.user import User
        db = SessionLocal()
        user = db.query(User).filter(User.email == "wrong-pass@example.com").first()
        user.is_verified = True
        user.verify_token = None
        db.commit()
        db.close()

        response = client.post("/api/auth/login", json={
            "email": "wrong-pass@example.com",
            "password": "wrongpassword",
        })
        assert response.status_code == 401

    def test_login_unverified(self, client):
        client.post("/api/auth/register", json={
            "email": "unverified@example.com",
            "password": "securepass123",
        })

        response = client.post("/api/auth/login", json={
            "email": "unverified@example.com",
            "password": "securepass123",
        })
        assert response.status_code == 403
        assert "not verified" in response.json()["detail"]

    def test_refresh_token(self, client):
        client.post("/api/auth/register", json={
            "email": "refresh@example.com",
            "password": "securepass123",
        })
        from app.database import SessionLocal
        from app.models.user import User
        db = SessionLocal()
        user = db.query(User).filter(User.email == "refresh@example.com").first()
        user.is_verified = True
        user.verify_token = None
        db.commit()
        db.close()

        login_resp = client.post("/api/auth/login", json={
            "email": "refresh@example.com",
            "password": "securepass123",
        })
        refresh_token = login_resp.json()["refresh_token"]

        response = client.post("/api/auth/refresh", json={
            "refresh_token": refresh_token,
        })
        assert response.status_code == 200
        assert "access_token" in response.json()

    def test_refresh_invalid_token(self, client):
        response = client.post("/api/auth/refresh", json={
            "refresh_token": "invalid-token",
        })
        assert response.status_code == 401

    def test_forgot_password(self, client):
        client.post("/api/auth/register", json={
            "email": "forgot@example.com",
            "password": "securepass123",
        })
        from app.database import SessionLocal
        from app.models.user import User
        db = SessionLocal()
        user = db.query(User).filter(User.email == "forgot@example.com").first()
        user.is_verified = True
        user.verify_token = None
        db.commit()
        db.close()

        response = client.post("/api/auth/forgot-password", json={
            "email": "forgot@example.com",
        })
        assert response.status_code == 200

    def test_forgot_password_nonexistent(self, client):
        response = client.post("/api/auth/forgot-password", json={
            "email": "noone@example.com",
        })
        assert response.status_code == 200  # Don't reveal existence

    def test_reset_password(self, client):
        client.post("/api/auth/register", json={
            "email": "reset@example.com",
            "password": "oldpass123",
        })
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

        response = client.post(f"/api/auth/reset-password/{reset_token}", json={
            "password": "newpass456",
        })
        assert response.status_code == 200

        # Verify can login with new password
        login_resp = client.post("/api/auth/login", json={
            "email": "reset@example.com",
            "password": "newpass456",
        })
        assert login_resp.status_code == 200

    def test_reset_password_invalid_token(self, client):
        response = client.post("/api/auth/reset-password/bad-token", json={
            "password": "newpass456",
        })
        assert response.status_code == 404


class TestCards:
    def test_create_card(self, client, auth_headers):
        response = client.post("/api/cards", json={
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
        }, headers=auth_headers)
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "My Card"
        assert data["img_url"] == "data:image/png;base64,abc123"
        assert data["share_slug"] is None

    def test_create_card_unauthorized(self, client):
        response = client.post("/api/cards", json={
            "title": "No Auth",
            "elements": [],
            "img_url": "data:image/png;base64,test",
            "theme": {
                "fill": "#111111", "banner_fill": "#222222",
                "box_fill": "#333333", "stroke": "#444444",
                "banner_text": "#555555", "box_text": "#666666",
            },
        })
        assert response.status_code == 401

    def test_list_cards(self, client, auth_headers):
        # Create a card first
        client.post("/api/cards", json={
            "title": "Card 1",
            "elements": [],
            "img_url": "data:image/png;base64,test",
            "theme": {
                "fill": "#111111", "banner_fill": "#222222",
                "box_fill": "#333333", "stroke": "#444444",
                "banner_text": "#555555", "box_text": "#666666",
            },
        }, headers=auth_headers)

        response = client.get("/api/cards", headers=auth_headers)
        assert response.status_code == 200
        cards = response.json()
        assert isinstance(cards, list)
        assert len(cards) >= 1
        assert cards[0]["title"] == "Card 1"
        assert "img_url" not in cards[0]  # Summary doesn't include full data

    def test_list_cards_unauthorized(self, client):
        response = client.get("/api/cards")
        assert response.status_code == 401

    def test_get_card(self, client, auth_headers):
        create_resp = client.post("/api/cards", json={
            "title": "Single Card",
            "elements": [],
            "img_url": "data:image/png;base64,test",
            "theme": {
                "fill": "#111111", "banner_fill": "#222222",
                "box_fill": "#333333", "stroke": "#444444",
                "banner_text": "#555555", "box_text": "#666666",
            },
        }, headers=auth_headers)
        card_id = create_resp.json()["id"]

        response = client.get(f"/api/cards/{card_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["img_url"] == "data:image/png;base64,test"

    def test_get_card_not_found(self, client, auth_headers):
        response = client.get("/api/cards/nonexistent-id", headers=auth_headers)
        assert response.status_code == 404

    def test_update_card(self, client, auth_headers):
        create_resp = client.post("/api/cards", json={
            "title": "Original",
            "elements": [],
            "img_url": "data:image/png;base64,test",
            "theme": {
                "fill": "#111111", "banner_fill": "#222222",
                "box_fill": "#333333", "stroke": "#444444",
                "banner_text": "#555555", "box_text": "#666666",
            },
        }, headers=auth_headers)
        card_id = create_resp.json()["id"]

        response = client.put(f"/api/cards/{card_id}", json={
            "title": "Updated",
        }, headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["title"] == "Updated"

    def test_delete_card(self, client, auth_headers):
        create_resp = client.post("/api/cards", json={
            "title": "To Delete",
            "elements": [],
            "img_url": "data:image/png;base64,test",
            "theme": {
                "fill": "#111111", "banner_fill": "#222222",
                "box_fill": "#333333", "stroke": "#444444",
                "banner_text": "#555555", "box_text": "#666666",
            },
        }, headers=auth_headers)
        card_id = create_resp.json()["id"]

        response = client.delete(f"/api/cards/{card_id}", headers=auth_headers)
        assert response.status_code == 204

        # Verify it's gone
        get_resp = client.get(f"/api/cards/{card_id}", headers=auth_headers)
        assert get_resp.status_code == 404

    def test_cannot_access_other_users_card(self, client, auth_headers):
        # Create card as auth_headers user
        create_resp = client.post("/api/cards", json={
            "title": "My Card",
            "elements": [],
            "img_url": "data:image/png;base64,test",
            "theme": {
                "fill": "#111111", "banner_fill": "#222222",
                "box_fill": "#333333", "stroke": "#444444",
                "banner_text": "#555555", "box_text": "#666666",
            },
        }, headers=auth_headers)

        card_id = create_resp.json()["id"]

        # Register a second user
        client.post("/api/auth/register", json={
            "email": "other@example.com",
            "password": "testpass123",
        })
        from app.database import SessionLocal
        from app.models.user import User
        db = SessionLocal()
        other_user = db.query(User).filter(User.email == "other@example.com").first()
        other_user.is_verified = True
        other_user.verify_token = None
        db.commit()
        db.close()

        other_login = client.post("/api/auth/login", json={
            "email": "other@example.com",
            "password": "testpass123",
        })
        other_token = other_login.json()["access_token"]
        other_headers = {"Authorization": f"Bearer {other_token}"}

        response = client.get(f"/api/cards/{card_id}", headers=other_headers)
        assert response.status_code == 404


class TestShare:
    def test_share_card(self, client, auth_headers):
        create_resp = client.post("/api/cards", json={
            "title": "Share Me",
            "elements": [],
            "img_url": "data:image/png;base64,test",
            "theme": {
                "fill": "#111111", "banner_fill": "#222222",
                "box_fill": "#333333", "stroke": "#444444",
                "banner_text": "#555555", "box_text": "#666666",
            },
        }, headers=auth_headers)
        card_id = create_resp.json()["id"]

        response = client.post(f"/api/cards/{card_id}/share", json={
            "mode": "view_and_copy",
        }, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["share_slug"] is not None
        assert data["share_mode"] == "view_and_copy"

    def test_share_card_invalid_mode(self, client, auth_headers):
        create_resp = client.post("/api/cards", json={
            "title": "Bad Mode",
            "elements": [],
            "img_url": "data:image/png;base64,test",
            "theme": {
                "fill": "#111111", "banner_fill": "#222222",
                "box_fill": "#333333", "stroke": "#444444",
                "banner_text": "#555555", "box_text": "#666666",
            },
        }, headers=auth_headers)
        card_id = create_resp.json()["id"]

        response = client.post(f"/api/cards/{card_id}/share", json={
            "mode": "invalid_mode",
        }, headers=auth_headers)
        assert response.status_code == 400

    def test_unshare_card(self, client, auth_headers):
        create_resp = client.post("/api/cards", json={
            "title": "Unshare Me",
            "elements": [],
            "img_url": "data:image/png;base64,test",
            "theme": {
                "fill": "#111111", "banner_fill": "#222222",
                "box_fill": "#333333", "stroke": "#444444",
                "banner_text": "#555555", "box_text": "#666666",
            },
        }, headers=auth_headers)
        card_id = create_resp.json()["id"]

        client.post(f"/api/cards/{card_id}/share", json={
            "mode": "view_only",
        }, headers=auth_headers)

        response = client.delete(f"/api/cards/{card_id}/share", headers=auth_headers)
        assert response.status_code == 204

        # Verify unshared
        card = client.get(f"/api/cards/{card_id}", headers=auth_headers)
        assert card.json()["share_slug"] is None

    def test_view_shared_card_view_only(self, client, auth_headers):
        create_resp = client.post("/api/cards", json={
            "title": "Public View Only",
            "elements": [{"id": "e1", "type": "text"}],
            "img_url": "data:image/png;base64,test",
            "theme": {
                "fill": "#111111", "banner_fill": "#222222",
                "box_fill": "#333333", "stroke": "#444444",
                "banner_text": "#555555", "box_text": "#666666",
            },
        }, headers=auth_headers)
        card_id = create_resp.json()["id"]

        share_resp = client.post(f"/api/cards/{card_id}/share", json={
            "mode": "view_only",
        }, headers=auth_headers)
        slug = share_resp.json()["share_slug"]

        response = client.get(f"/api/shared/{slug}")
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Public View Only"
        assert data["can_copy"] is False

    def test_view_shared_card_view_and_copy(self, client, auth_headers):
        create_resp = client.post("/api/cards", json={
            "title": "Public Copyable",
            "elements": [],
            "img_url": "data:image/png;base64,test",
            "theme": {
                "fill": "#111111", "banner_fill": "#222222",
                "box_fill": "#333333", "stroke": "#444444",
                "banner_text": "#555555", "box_text": "#666666",
            },
        }, headers=auth_headers)
        card_id = create_resp.json()["id"]

        share_resp = client.post(f"/api/cards/{card_id}/share", json={
            "mode": "view_and_copy",
        }, headers=auth_headers)
        slug = share_resp.json()["share_slug"]

        response = client.get(f"/api/shared/{slug}")
        assert response.status_code == 200
        assert response.json()["can_copy"] is True

    def test_view_shared_card_not_found(self, client):
        response = client.get("/api/shared/nonexistent-slug")
        assert response.status_code == 404

    def test_view_shared_card_different_user(self, client, auth_headers):
        # Create and share as auth_headers user
        create_resp = client.post("/api/cards", json={
            "title": "Cross User",
            "elements": [],
            "img_url": "data:image/png;base64,test",
            "theme": {
                "fill": "#111111", "banner_fill": "#222222",
                "box_fill": "#333333", "stroke": "#444444",
                "banner_text": "#555555", "box_text": "#666666",
            },
        }, headers=auth_headers)
        card_id = create_resp.json()["id"]

        share_resp = client.post(f"/api/cards/{card_id}/share", json={
            "mode": "view_and_copy",
        }, headers=auth_headers)
        slug = share_resp.json()["share_slug"]

        # Another user (unauthenticated) can view it
        response = client.get(f"/api/shared/{slug}")
        assert response.status_code == 200
        assert response.json()["title"] == "Cross User"


class TestDevMail:
    def test_list_mail(self, client):
        client.post("/api/auth/register", json={
            "email": "devmail@example.com",
            "password": "testpass123",
        })
        response = client.get("/api/dev/mail")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert "subject" in data[0]
        assert "to_email" in data[0]

    def test_mail_contains_registration_emails(self, client):
        client.post("/api/auth/register", json={
            "email": "devmail2@example.com",
            "password": "testpass123",
        })
        response = client.get("/api/dev/mail")
        emails = response.json()
        subjects = [e["subject"] for e in emails]
        assert any("Verify your DnD Card Maker account" in s for s in subjects)

    def test_get_single_mail(self, client):
        client.post("/api/auth/register", json={
            "email": "devmail3@example.com",
            "password": "testpass123",
        })
        list_resp = client.get("/api/dev/mail")
        email_id = list_resp.json()[0]["id"]

        response = client.get(f"/api/dev/mail/{email_id}")
        assert response.status_code == 200
        data = response.json()
        assert "html_body" in data
        assert len(data["html_body"]) > 0

    def test_get_mail_not_found(self, client):
        response = client.get("/api/dev/mail/nonexistent-id")
        assert response.status_code == 404

    def test_clear_mail(self, client):
        client.post("/api/auth/register", json={
            "email": "devmail4@example.com",
            "password": "testpass123",
        })
        response = client.delete("/api/dev/mail")
        assert response.status_code == 204

        list_resp = client.get("/api/dev/mail")
        assert list_resp.json() == []
