"""API integration tests for /api/dev/mail endpoints."""

from app.config import settings
from tests.conftest import TestSessionLocal


class TestDevMail:
    def _get_headers(self, client, email, password="testpass123"):
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
        return {
            "Authorization": f"Bearer {token}",
            "X-Dev-Auth": settings.jwt_secret,
        }

    def test_list_mail(self, client):
        headers = self._get_headers(client, "devmail@example.com")
        response = client.get("/api/dev/mail", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert "subject" in data[0]
        assert "to_email" in data[0]

    def test_mail_contains_registration_emails(self, client):
        headers = self._get_headers(client, "devmail2@example.com")
        response = client.get("/api/dev/mail", headers=headers)
        emails = response.json()
        subjects = [e["subject"] for e in emails]
        assert any("Verify your DnD Card Maker account" in s for s in subjects)

    def test_get_single_mail(self, client):
        headers = self._get_headers(client, "devmail3@example.com")
        list_resp = client.get("/api/dev/mail", headers=headers)
        email_id = list_resp.json()[0]["id"]

        response = client.get(f"/api/dev/mail/{email_id}", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "html_body" in data
        assert len(data["html_body"]) > 0

    def test_get_mail_not_found(self, client):
        headers = self._get_headers(client, "devmail-nf@example.com")
        response = client.get("/api/dev/mail/nonexistent-id", headers=headers)
        assert response.status_code == 404

    def test_clear_mail(self, client):
        headers = self._get_headers(client, "devmail4@example.com")
        response = client.delete("/api/dev/mail", headers=headers)
        assert response.status_code == 204

        list_resp = client.get("/api/dev/mail", headers=headers)
        assert list_resp.json() == []
