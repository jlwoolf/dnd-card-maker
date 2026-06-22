import os

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

engine = create_engine(
    f"sqlite:///{settings.sqlite_path}",
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def _migrate_db(engine) -> None:
    """Add missing columns to existing tables for SQLite (no auto-migration)."""
    inspector = inspect(engine)

    # token_version on users (added for token invalidation on password reset)
    if "users" in inspector.get_table_names():
        cols = {c["name"] for c in inspector.get_columns("users")}
        if "token_version" not in cols:
            with engine.connect() as conn:
                conn.execute(
                    text("ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0")
                )
                conn.commit()


def init_db() -> None:
    os.makedirs(os.path.dirname(settings.sqlite_path) or ".", exist_ok=True)
    from app.models.card import Card  # noqa: F401
    from app.models.deck import Deck, DeckCard  # noqa: F401
    from app.models.email import SentEmail  # noqa: F401
    from app.models.user import User  # noqa: F401

    Base.metadata.create_all(bind=engine)
    _migrate_db(engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
