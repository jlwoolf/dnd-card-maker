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
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db(monkeypatch: pytest.MonkeyPatch) -> Generator[None, None, None]:
    from app import database
    from app.database import get_db

    monkeypatch.setattr(database, "SessionLocal", TestSessionLocal)

    Base.metadata.create_all(bind=test_engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.clear()

    test_engine.dispose()
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def auth_headers(client: TestClient) -> dict[str, str]:
    client.post("/api/auth/register", json={
        "email": "auth-test@example.com",
        "password": "testpass123",
    })

    db = TestSessionLocal()
    try:
        from app.models.user import User
        user = db.query(User).filter(User.email == "auth-test@example.com").first()
        user.is_verified = True
        user.verify_token = None
        db.commit()
    finally:
        db.close()

    response = client.post("/api/auth/login", json={
        "email": "auth-test@example.com",
        "password": "testpass123",
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
