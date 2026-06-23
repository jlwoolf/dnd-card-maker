"""Unit tests for app/dependencies.py — get_current_user dependency."""

from datetime import timedelta

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.config import settings
from app.constants import TOKEN_TYPE_ACCESS
from app.dependencies import get_current_user
from app.models.user import User
from app.services.auth import create_access_token, create_refresh_token


def _make_credentials(token: str) -> HTTPAuthorizationCredentials:
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)


def _create_verified_user(db_session, email: str = "dep-test@example.com") -> User:
    from app.services.auth import hash_password

    user = User(
        id="dep-user-1",
        email=email,
        password_hash=hash_password("testpass123"),
        is_verified=True,
    )
    db_session.add(user)
    db_session.commit()
    return user


class TestGetCurrentUser:
    def test_valid_token_returns_user(self, db_session):
        user = _create_verified_user(db_session)
        token = create_access_token(
            {"sub": user.id, "email": user.email, "tv": user.token_version},
            settings.jwt_secret,
            timedelta(minutes=15),
        )
        result = get_current_user(_make_credentials(token), db_session)
        assert result.id == user.id
        assert result.email == user.email

    def test_missing_bearer_header_treated_as_invalid(self, db_session):
        """FastAPI HTTPBearer enforces the header, but if somehow bypassed we test manually."""
        with pytest.raises(HTTPException) as exc:
            get_current_user(_make_credentials("not-a-jwt"), db_session)
        assert exc.value.status_code == 401

    def test_wrong_token_type_refresh_used_as_access(self, db_session):
        user = _create_verified_user(db_session)
        refresh = create_refresh_token(
            {"sub": user.id, "tv": user.token_version},
            settings.jwt_secret,
            timedelta(days=7),
        )
        with pytest.raises(HTTPException) as exc:
            get_current_user(_make_credentials(refresh), db_session)
        assert exc.value.status_code == 401

    def test_user_not_found(self, db_session):
        token = create_access_token(
            {"sub": "nonexistent-user", "email": "no@example.com", "tv": 0},
            settings.jwt_secret,
            timedelta(minutes=15),
        )
        with pytest.raises(HTTPException) as exc:
            get_current_user(_make_credentials(token), db_session)
        assert exc.value.status_code == 401

    def test_token_version_mismatch(self, db_session):
        user = _create_verified_user(db_session)
        token = create_access_token(
            {"sub": user.id, "email": user.email, "tv": 99},  # wrong version
            settings.jwt_secret,
            timedelta(minutes=15),
        )
        with pytest.raises(HTTPException) as exc:
            get_current_user(_make_credentials(token), db_session)
        assert exc.value.status_code == 401

    def test_unverified_user_rejected(self, db_session):
        from app.services.auth import hash_password

        user = User(
            id="unverified-id",
            email="unverified@example.com",
            password_hash=hash_password("testpass123"),
            is_verified=False,
        )
        db_session.add(user)
        db_session.commit()

        token = create_access_token(
            {"sub": user.id, "email": user.email, "tv": user.token_version},
            settings.jwt_secret,
            timedelta(minutes=15),
        )
        with pytest.raises(HTTPException) as exc:
            get_current_user(_make_credentials(token), db_session)
        assert exc.value.status_code == 403

    def test_expired_token_rejected(self, db_session):
        user = _create_verified_user(db_session)
        token = create_access_token(
            {"sub": user.id, "email": user.email, "tv": user.token_version},
            settings.jwt_secret,
            timedelta(seconds=-1),
        )
        with pytest.raises(HTTPException) as exc:
            get_current_user(_make_credentials(token), db_session)
        assert exc.value.status_code == 401
