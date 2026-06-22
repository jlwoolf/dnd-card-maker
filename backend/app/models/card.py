from __future__ import annotations

from datetime import UTC, datetime
from typing import TYPE_CHECKING
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.deck import DeckCard
    from app.models.user import User


class Card(Base):
    """A DnD-style card with rich text elements, images, and theme configuration.

    Cards belong to a user and can be included in multiple decks via the
    DeckCard junction table. Cards can be shared publicly via a unique slug
    in either view_only or view_and_copy mode.
    """

    __tablename__ = "cards"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    elements: Mapped[str] = mapped_column(Text, nullable=False)
    img_url: Mapped[str] = mapped_column(Text, nullable=False)
    theme: Mapped[str] = mapped_column(Text, nullable=False)
    share_slug: Mapped[str | None] = mapped_column(
        String, unique=True, nullable=True, default=None, index=True
    )
    share_mode: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    share_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    owner: Mapped[User] = relationship("User")
    deck_cards: Mapped[list[DeckCard]] = relationship(
        "DeckCard",
        back_populates="card",
        cascade="all, delete-orphan",
    )
