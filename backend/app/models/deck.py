from datetime import UTC, datetime
from typing import TYPE_CHECKING
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.card import Card


class Deck(Base):
    __tablename__ = "decks"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    is_autosave: Mapped[bool] = mapped_column(Boolean, default=False)
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

    deck_cards: Mapped[list["DeckCard"]] = relationship(
        "DeckCard",
        back_populates="deck",
        cascade="all, delete-orphan",
        order_by="DeckCard.position",
    )


class DeckCard(Base):
    __tablename__ = "deck_cards"

    deck_id: Mapped[str] = mapped_column(String, ForeignKey("decks.id"), primary_key=True)
    card_id: Mapped[str] = mapped_column(String, ForeignKey("cards.id"), primary_key=True)
    position: Mapped[int] = mapped_column(Integer, default=0)

    deck: Mapped["Deck"] = relationship("Deck", back_populates="deck_cards")
    card: Mapped["Card"] = relationship("Card", back_populates="deck_cards")
