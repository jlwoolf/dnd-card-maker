from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class User(Base):
    """User account with email verification, password reset, and JWT auth.

    The ``token_version`` field is incremented on password reset to invalidate
    all previously-issued refresh tokens.
    """

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verify_token: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    reset_token: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    reset_expires: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, default=None)
    token_version: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))
