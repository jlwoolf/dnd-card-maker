"""API integration tests for /api/users/me endpoints."""

import pytest


class TestChangePassword:
    def test_success(self, client, auth_headers):
        resp = client.post(
            "/api/users/me/change-password",
            json={"current_password": "testpass123", "new_password": "newpass456"},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert "Password changed" in resp.json()["message"]

    def test_wrong_current_password(self, client, auth_headers):
        resp = client.post(
            "/api/users/me/change-password",
            json={"current_password": "wrongpass", "new_password": "newpass456"},
            headers=auth_headers,
        )
        assert resp.status_code == 400
        assert "Current password is incorrect" in resp.json()["detail"]

    def test_token_invalidated_after_password_change(self, client, auth_headers):
        client.post(
            "/api/users/me/change-password",
            json={"current_password": "testpass123", "new_password": "newpass456"},
            headers=auth_headers,
        )
        # Old token should be invalid (token_version incremented)
        resp = client.get("/api/cards", headers=auth_headers)
        assert resp.status_code == 401
        assert "Token version mismatch" in resp.json()["detail"]

    def test_can_login_with_new_password(self, client):
        # Register fresh user
        client.post("/api/auth/register", json={"email": "pw-change@example.com", "password": "oldpass123"})
        db = __import__("tests.conftest", fromlist=["TestSessionLocal"]).TestSessionLocal()
        try:
            from app.models.user import User

            user = db.query(User).filter(User.email == "pw-change@example.com").first()
            user.is_verified = True
            user.verify_token = None
            db.commit()
        finally:
            db.close()

        login = client.post("/api/auth/login", json={"email": "pw-change@example.com", "password": "oldpass123"})
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        client.post("/api/users/me/change-password",
                     json={"current_password": "oldpass123", "new_password": "newpass789"},
                     headers=headers)

        # Login with new password
        new_login = client.post("/api/auth/login", json={"email": "pw-change@example.com", "password": "newpass789"})
        assert new_login.status_code == 200

        # Old password should fail
        old_login = client.post("/api/auth/login", json={"email": "pw-change@example.com", "password": "oldpass123"})
        assert old_login.status_code == 401


class TestUpdateEmail:
    def test_success(self, client, auth_headers):
        resp = client.put(
            "/api/users/me/email",
            json={"password": "testpass123", "new_email": "newemail@example.com"},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert "Email updated" in resp.json()["message"]

    def test_wrong_password(self, client, auth_headers):
        resp = client.put(
            "/api/users/me/email",
            json={"password": "wrongpass", "new_email": "newemail@example.com"},
            headers=auth_headers,
        )
        assert resp.status_code == 400
        assert "Password is incorrect" in resp.json()["detail"]

    def test_email_already_in_use(self, client, auth_headers):
        # Register another user
        from tests.conftest import TestSessionLocal

        client.post("/api/auth/register", json={"email": "existing@example.com", "password": "testpass123"})
        db = TestSessionLocal()
        try:
            from app.models.user import User

            user = db.query(User).filter(User.email == "existing@example.com").first()
            user.is_verified = True
            db.commit()
        finally:
            db.close()

        resp = client.put(
            "/api/users/me/email",
            json={"password": "testpass123", "new_email": "existing@example.com"},
            headers=auth_headers,
        )
        assert resp.status_code == 409
        assert "already in use" in resp.json()["detail"]

    def test_user_becomes_unverified_after_email_change(self, client, auth_headers):
        client.put(
            "/api/users/me/email",
            json={"password": "testpass123", "new_email": "unverified-new@example.com"},
            headers=auth_headers,
        )
        # User should be unverified now
        from tests.conftest import TestSessionLocal

        db = TestSessionLocal()
        try:
            from app.models.user import User

            user = db.query(User).filter(User.email == "unverified-new@example.com").first()
            assert user is not None
            assert user.is_verified is False
            assert user.verify_token is not None
        finally:
            db.close()


class TestDeleteAccount:
    def test_success(self, client, auth_headers):
        resp = client.request(
            "DELETE",
            "/api/users/me",
            json={"password": "testpass123"},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert "Account deleted" in resp.json()["message"]

    def test_wrong_password(self, client, auth_headers):
        resp = client.request(
            "DELETE",
            "/api/users/me",
            json={"password": "wrongpass"},
            headers=auth_headers,
        )
        assert resp.status_code == 400
        assert "Password is incorrect" in resp.json()["detail"]

    def test_cannot_login_after_deletion(self, client):
        # Register & verify a new user specifically for deletion test
        client.post("/api/auth/register",
                     json={"email": "delete-me@example.com", "password": "testpass123"})
        db = __import__("tests.conftest", fromlist=["TestSessionLocal"]).TestSessionLocal()
        try:
            from app.models.user import User

            user = db.query(User).filter(User.email == "delete-me@example.com").first()
            user.is_verified = True
            user.verify_token = None
            db.commit()
        finally:
            db.close()

        login = client.post("/api/auth/login",
                            json={"email": "delete-me@example.com", "password": "testpass123"})
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        client.request("DELETE", "/api/users/me", json={"password": "testpass123"}, headers=headers)

        # Should not be able to login
        resp = client.post("/api/auth/login",
                           json={"email": "delete-me@example.com", "password": "testpass123"})
        assert resp.status_code == 401
