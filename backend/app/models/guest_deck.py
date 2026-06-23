"""Guest-autosave deck model.

Guest (unauthenticated) deck data is stored in a single JSON blob so
it can be persisted without requiring a user account.  The frontend
stores only the deck UUID in ``localStorage``; the full payload lives
here and is automatically cleaned up after 30 days of inactivity.
"""

from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class GuestDeck(Base):
    __tablename__ = "guest_decks"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    cards_json: Mapped[str] = mapped_column(Text, nullable=False)
    editing_cloud_deck_id: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    editing_cloud_deck_title: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(UTC)
    )
    last_accessed_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )
