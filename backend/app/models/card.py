from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Card(Base):
    __tablename__ = "cards"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id"), nullable=False, index=True
    )
    title: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    elements: Mapped[str] = mapped_column(Text, nullable=False)
    img_url: Mapped[str] = mapped_column(Text, nullable=False)
    theme: Mapped[str] = mapped_column(Text, nullable=False)
    share_slug: Mapped[str | None] = mapped_column(
        String, unique=True, nullable=True, default=None, index=True
    )
    share_mode: Mapped[str | None] = mapped_column(
        String, nullable=True, default=None
    )
    share_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True, default=None
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    owner: Mapped["User"] = relationship("User")  # noqa: F821
