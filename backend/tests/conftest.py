"""Pytest fixtures for backend integration tests.

Creates a temporary SQLite database per test run, overrides the FastAPI
dependency injection to use the test DB session, and disables rate limiting
so tests run without throttling.
"""

import os
import tempfile
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.database import Base
from app.main import app

_test_db_fd, TEST_DB_PATH = tempfile.mkstemp(suffix=".db", prefix="test_cards_")
os.close(_test_db_fd)
TEST_DB_URL = f"sqlite:///{TEST_DB_PATH}"

test_engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db() -> Generator[Session, None, None]:
    """FastAPI dependency override that yields a test DB session."""
    db = TestSessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db(monkeypatch: pytest.MonkeyPatch) -> Generator[None, None, None]:
    """Replace the production DB session with a test session and disable rate limits."""
    from slowapi import Limiter

    from app import database
    from app.database import get_db

    monkeypatch.setattr(database, "SessionLocal", TestSessionLocal)

    Base.metadata.create_all(bind=test_engine)
    app.dependency_overrides[get_db] = override_get_db

    # Disable rate limiting in tests
    app.state.limiter = Limiter(
        key_func=lambda: "test",
        storage_uri="memory://",
        default_limits=[],
    )

    yield
    app.dependency_overrides.clear()

    test_engine.dispose()
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)


@pytest.fixture
def client() -> TestClient:
    """Return a FastAPI TestClient for the application."""
    return TestClient(app)


@pytest.fixture
def auth_headers(client: TestClient) -> dict[str, str]:
    """Return Authorization headers for a pre-authenticated, verified test user."""
    client.post(
        "/api/auth/register",
        json={
            "email": "auth-test@example.com",
            "password": "testpass123",
        },
    )

    db = TestSessionLocal()
    try:
        from app.models.user import User

        user = db.query(User).filter(User.email == "auth-test@example.com").first()
        user.is_verified = True
        user.verify_token = None
        db.commit()
    finally:
        db.close()

    response = client.post(
        "/api/auth/login",
        json={
            "email": "auth-test@example.com",
            "password": "testpass123",
        },
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
