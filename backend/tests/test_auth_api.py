"""API integration tests for /api/auth endpoints."""

from tests.conftest import TestSessionLocal


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
        assert response.status_code == 201
        assert "verification email has been resent" in response.json()["message"]

    def test_register_duplicate_verified_email(self, client):
        client.post(
            "/api/auth/register",
            json={
                "email": "dupv@example.com",
                "password": "securepass123",
            },
        )
        db = TestSessionLocal()
        try:
            from app.models.user import User

            user = db.query(User).filter(User.email == "dupv@example.com").first()
            user.is_verified = True
            user.verify_token = None
            db.commit()
        finally:
            db.close()

        response = client.post(
            "/api/auth/register",
            json={
                "email": "dupv@example.com",
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


class TestAuthEdgeCases:
    """Additional auth edge case tests."""

    def test_refresh_with_access_token_fails(self, client):
        client.post("/api/auth/register", json={"email": "access-refresh@example.com", "password": "testpass123"})
        db = TestSessionLocal()
        try:
            from app.models.user import User

            user = db.query(User).filter(User.email == "access-refresh@example.com").first()
            user.is_verified = True
            user.verify_token = None
            db.commit()
        finally:
            db.close()

        login = client.post("/api/auth/login", json={"email": "access-refresh@example.com", "password": "testpass123"})
        access_token = login.json()["access_token"]

        # Try to use access token as refresh token
        resp = client.post("/api/auth/refresh", json={"refresh_token": access_token})
        assert resp.status_code == 401

    def test_reset_password_expired_token_fails(self, client):
        client.post("/api/auth/register", json={"email": "expired-reset@example.com", "password": "oldpass123"})
        db = TestSessionLocal()
        try:
            from app.models.user import User
            from datetime import UTC, datetime, timedelta

            user = db.query(User).filter(User.email == "expired-reset@example.com").first()
            user.is_verified = True
            user.verify_token = None
            user.reset_token = "expired-token-123"
            user.reset_expires = datetime.now(UTC) - timedelta(hours=1)
            db.commit()
        finally:
            db.close()

        resp = client.post("/api/auth/reset-password/expired-token-123", json={"password": "newpass456"})
        assert resp.status_code == 404

    def test_reset_password_auto_verifies_unverified_user(self, client):
        client.post("/api/auth/register", json={"email": "auto-verify@example.com", "password": "oldpass123"})
        db = TestSessionLocal()
        try:
            from app.models.user import User
            from datetime import UTC, datetime, timedelta

            user = db.query(User).filter(User.email == "auto-verify@example.com").first()
            # User is NOT verified
            user.reset_token = "verify-me-token"
            user.reset_expires = datetime.now(UTC) + timedelta(hours=1)
            db.commit()
        finally:
            db.close()

        resp = client.post("/api/auth/reset-password/verify-me-token", json={"password": "newpass789"})
        assert resp.status_code == 200

        # User should be verified now
        login = client.post("/api/auth/login", json={"email": "auto-verify@example.com", "password": "newpass789"})
        assert login.status_code == 200
