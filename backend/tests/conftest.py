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
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker

# Enable dev mail & admin routes in tests before app import
os.environ.setdefault("DEV_MAIL_ENABLED", "true")

from app.database import Base  # noqa: E402
from app.main import app  # noqa: E402

_test_db_fd, TEST_DB_PATH = tempfile.mkstemp(suffix=".db", prefix="test_cards_")
os.close(_test_db_fd)
TEST_DB_URL = f"sqlite:///{TEST_DB_PATH}"

test_engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# Enable SQLite foreign key constraints for proper cascade / orphan handling
@event.listens_for(test_engine, "connect")
def _set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


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
def db_session() -> Generator[Session, None, None]:
    """Return a raw SQLAlchemy session for service-level / unit tests."""
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.close()


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


@pytest.fixture
def other_auth_headers(client: TestClient) -> dict[str, str]:
    """Return Authorization headers for a second verified user (cross-user tests)."""
    client.post(
        "/api/auth/register",
        json={
            "email": "other-user@example.com",
            "password": "testpass123",
        },
    )

    db = TestSessionLocal()
    try:
        from app.models.user import User

        user = db.query(User).filter(User.email == "other-user@example.com").first()
        user.is_verified = True
        user.verify_token = None
        db.commit()
    finally:
        db.close()

    response = client.post(
        "/api/auth/login",
        json={
            "email": "other-user@example.com",
            "password": "testpass123",
        },
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# Factory helpers — reduce boilerplate in test files
# ---------------------------------------------------------------------------

def _make_theme(**overrides: str) -> dict:
    return {
        "fill": "#111111",
        "banner_fill": "#222222",
        "box_fill": "#333333",
        "stroke": "#444444",
        "banner_text": "#555555",
        "box_text": "#666666",
    } | overrides


@pytest.fixture
def make_theme():
    """Return a dict of default theme colours, optionally overridden."""
    return _make_theme


@pytest.fixture
def create_test_card(client, auth_headers):
    """Factory fixture: returns a function that creates a card via the API."""
    def _create(
        *,
        title: str = "Test Card",
        elements: list | None = None,
        img_url: str = "data:image/png;base64,test",
        theme: dict | None = None,
        headers: dict | None = None,
    ) -> dict:
        h = headers or auth_headers
        resp = client.post(
            "/api/cards",
            json={
                "title": title,
                "elements": elements or [],
                "img_url": img_url,
                "theme": theme or _make_theme(),
            },
            headers=h,
        )
        assert resp.status_code == 201, resp.text
        return resp.json()

    return _create


@pytest.fixture
def create_test_deck(client, auth_headers):
    """Factory fixture: returns a function that creates a deck via the API."""
    def _create(
        *,
        title: str = "Test Deck",
        card_ids: list[str] | None = None,
        headers: dict | None = None,
    ) -> dict:
        h = headers or auth_headers
        resp = client.post(
            "/api/decks",
            json={"title": title, "card_ids": card_ids or []},
            headers=h,
        )
        assert resp.status_code == 201, resp.text
        return resp.json()

    return _create
