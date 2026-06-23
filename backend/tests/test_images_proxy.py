"""API integration tests for /api/images and /api/proxy endpoints."""

import pytest
from tests.conftest import TestSessionLocal


def _get_token_for_user(client, email: str, password: str = "testpass123") -> str:
    """Register, verify, login and return an access token."""
    from app.models.user import User

    client.post("/api/auth/register", json={"email": email, "password": password})
    db = TestSessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        user.is_verified = True
        user.verify_token = None
        db.commit()
    finally:
        db.close()

    resp = client.post("/api/auth/login", json={"email": email, "password": password})
    return resp.json()["access_token"]


class TestImageEndpoint:
    """Tests for GET /api/images/{card_id}."""

    def test_valid_token_returns_image(self, client, auth_headers):
        card = client.post(
            "/api/cards",
            json={
                "title": "Image Test",
                "elements": [],
                "img_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAAEklEQVR4nGP8z4APMOGVHbHSAEEsAROxCnMTAAAAAElFTkSuQmCC",
                "theme": {
                    "fill": "#111", "banner_fill": "#222", "box_fill": "#333",
                    "stroke": "#444", "banner_text": "#555", "box_text": "#666",
                },
            },
            headers=auth_headers,
        )
        card_id = card.json()["id"]
        token = _get_token_for_user(client, "img-test@example.com")  # same user as auth_headers

        resp = client.get(f"/api/images/{card_id}?token={token}")
        assert resp.status_code == 200
        assert resp.headers["content-type"] == "image/png"

    def test_no_token_public_card_returns_image(self, client, auth_headers, other_auth_headers):
        card = client.post(
            "/api/cards",
            json={
                "title": "Public Image",
                "elements": [],
                "img_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAAEklEQVR4nGP8z4APMOGVHbHSAEEsAROxCnMTAAAAAElFTkSuQmCC",
                "theme": {
                    "fill": "#111", "banner_fill": "#222", "box_fill": "#333",
                    "stroke": "#444", "banner_text": "#555", "box_text": "#666",
                },
            },
            headers=auth_headers,
        )
        card_id = card.json()["id"]

        share = client.post(
            f"/api/cards/{card_id}/share",
            json={"mode": "view_only"},
            headers=auth_headers,
        )

        # No token, but card is shared — should succeed
        resp = client.get(f"/api/images/{card_id}")
        assert resp.status_code == 200
        assert resp.headers["content-type"] == "image/png"

    def test_no_token_private_card_returns_401(self, client, auth_headers):
        card = client.post(
            "/api/cards",
            json={
                "title": "Private Image",
                "elements": [],
                "img_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAAEklEQVR4nGP8z4APMOGVHbHSAEEsAROxCnMTAAAAAElFTkSuQmCC",
                "theme": {
                    "fill": "#111", "banner_fill": "#222", "box_fill": "#333",
                    "stroke": "#444", "banner_text": "#555", "box_text": "#666",
                },
            },
            headers=auth_headers,
        )
        card_id = card.json()["id"]

        resp = client.get(f"/api/images/{card_id}")
        assert resp.status_code == 401
        assert "Authentication required" in resp.json()["detail"]

    def test_invalid_token_falls_through_to_public_check(self, client, auth_headers):
        card = client.post(
            "/api/cards",
            json={
                "title": "Falls Through",
                "elements": [],
                "img_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAAEklEQVR4nGP8z4APMOGVHbHSAEEsAROxCnMTAAAAAElFTkSuQmCC",
                "theme": {
                    "fill": "#111", "banner_fill": "#222", "box_fill": "#333",
                    "stroke": "#444", "banner_text": "#555", "box_text": "#666",
                },
            },
            headers=auth_headers,
        )
        card_id = card.json()["id"]

        # Share the card
        client.post(f"/api/cards/{card_id}/share", json={"mode": "view_only"}, headers=auth_headers)

        # Invalid token + shared card → should fall through to public path → 200
        resp = client.get(f"/api/images/{card_id}?token=invalid.token.here")
        assert resp.status_code == 200

    def test_invalid_token_private_card_returns_401(self, client, auth_headers):
        card = client.post(
            "/api/cards",
            json={
                "title": "Private Falls Through",
                "elements": [],
                "img_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAAEklEQVR4nGP8z4APMOGVHbHSAEEsAROxCnMTAAAAAElFTkSuQmCC",
                "theme": {
                    "fill": "#111", "banner_fill": "#222", "box_fill": "#333",
                    "stroke": "#444", "banner_text": "#555", "box_text": "#666",
                },
            },
            headers=auth_headers,
        )
        card_id = card.json()["id"]

        # Invalid token + not shared → 401
        resp = client.get(f"/api/images/{card_id}?token=invalid.token.here")
        assert resp.status_code == 401

    def test_card_not_found(self, client, auth_headers):
        token = _get_token_for_user(client, "img-nf@example.com")
        resp = client.get(f"/api/images/nonexistent-id?token={token}")
        assert resp.status_code == 404

    def test_token_version_mismatch(self, client, auth_headers):
        card = client.post(
            "/api/cards",
            json={
                "title": "Version Mismatch",
                "elements": [],
                "img_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAAEklEQVR4nGP8z4APMOGVHbHSAEEsAROxCnMTAAAAAElFTkSuQmCC",
                "theme": {
                    "fill": "#111", "banner_fill": "#222", "box_fill": "#333",
                    "stroke": "#444", "banner_text": "#555", "box_text": "#666",
                },
            },
            headers=auth_headers,
        )
        card_id = card.json()["id"]

        token = _get_token_for_user(client, "img-tv@example.com")
        # Change password to bump token_version
        hdrs = {"Authorization": f"Bearer {token}"}
        client.post("/api/users/me/change-password",
                     json={"current_password": "testpass123", "new_password": "newpass456"},
                     headers=hdrs)

        resp = client.get(f"/api/images/{card_id}?token={token}")
        assert resp.status_code == 401
        assert "Token version mismatch" in resp.json()["detail"]

    def test_unverified_user_token_rejected(self, client):
        client.post("/api/auth/register", json={"email": "unverified-img@example.com", "password": "testpass123"})
        # Don't verify — login should fail at the image endpoint
        db = TestSessionLocal()
        try:
            from app.models.user import User

            user = db.query(User).filter(User.email == "unverified-img@example.com").first()
            # Force login by temporarily verifying, get token, then unverify
            user.is_verified = True
            db.commit()
        finally:
            db.close()

        login = client.post("/api/auth/login",
                            json={"email": "unverified-img@example.com", "password": "testpass123"})
        token = login.json()["access_token"]

        # Unverify the user
        db2 = TestSessionLocal()
        try:
            from app.models.user import User

            user2 = db2.query(User).filter(User.email == "unverified-img@example.com").first()
            user2.is_verified = False
            db2.commit()
        finally:
            db2.close()

        # Create a card for them (need auth, temporarily re-verify)
        # Actually just test that an unverified user's token gets rejected
        hdrs = {"Authorization": f"Bearer {token}"}
        card = client.post(
            "/api/cards",
            json={
                "title": "Unverified Card",
                "elements": [],
                "img_url": "data:image/png;base64,test",
                "theme": {
                    "fill": "#111", "banner_fill": "#222", "box_fill": "#333",
                    "stroke": "#444", "banner_text": "#555", "box_text": "#666",
                },
            },
            headers=hdrs,
        )
        assert card.status_code == 403  # Can't create card while unverified

    def test_non_data_uri_img_url_returns_400(self, client, auth_headers):
        # Create a card via API with a non-data-URI img_url
        card = client.post(
            "/api/cards",
            json={
                "title": "Non-data Card",
                "elements": [],
                "img_url": "https://example.com/image.png",
                "theme": {
                    "fill": "#111", "banner_fill": "#222", "box_fill": "#333",
                    "stroke": "#444", "banner_text": "#555", "box_text": "#666",
                },
            },
            headers=auth_headers,
        )
        card_id = card.json()["id"]
        token = _get_token_for_user(client, "nondata-img@example.com")

        resp = client.get(f"/api/images/{card_id}?token={token}")
        assert resp.status_code == 400
        assert "Unsupported image format" in resp.json()["detail"]

    def test_scale_param_clamped(self, client, auth_headers):
        card = client.post(
            "/api/cards",
            json={
                "title": "Scale Test",
                "elements": [],
                "img_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAAEklEQVR4nGP8z4APMOGVHbHSAEEsAROxCnMTAAAAAElFTkSuQmCC",
                "theme": {
                    "fill": "#111", "banner_fill": "#222", "box_fill": "#333",
                    "stroke": "#444", "banner_text": "#555", "box_text": "#666",
                },
            },
            headers=auth_headers,
        )
        card_id = card.json()["id"]
        token = _get_token_for_user(client, "scale@example.com")

        # Valid scale
        resp = client.get(f"/api/images/{card_id}?token={token}&scale=0.5")
        assert resp.status_code == 200

        # Below minimum
        resp = client.get(f"/api/images/{card_id}?token={token}&scale=0.01")
        assert resp.status_code == 422

        # Above maximum
        resp = client.get(f"/api/images/{card_id}?token={token}&scale=1.5")
        assert resp.status_code == 422


class TestProxyEndpoint:
    """Tests for GET /api/proxy/image."""

    def test_invalid_scheme_rejected(self, client):
        resp = client.get("/api/proxy/image?url=ftp://example.com/image.png")
        assert resp.status_code == 400
        assert "Only http/https" in resp.json()["detail"]

    def test_file_scheme_rejected(self, client):
        resp = client.get("/api/proxy/image?url=file:///etc/passwd")
        assert resp.status_code == 400
        assert "Only http/https" in resp.json()["detail"]

    def test_loopback_rejected(self, client):
        resp = client.get("/api/proxy/image?url=http://localhost:8080/image.png")
        assert resp.status_code == 400
        assert "Loopback" in resp.json()["detail"]

    def test_127_0_0_1_rejected(self, client):
        resp = client.get("/api/proxy/image?url=http://127.0.0.1/image.png")
        assert resp.status_code == 400
        assert "Loopback" in resp.json()["detail"]
