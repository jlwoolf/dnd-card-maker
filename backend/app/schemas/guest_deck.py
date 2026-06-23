"""Pydantic schemas for guest (unauthenticated) deck auto-save.

All schemas validate data on both read (deserialised from the stored
JSON blob) and write (HTTP request body) to ensure data integrity.
"""

from typing import Any

from pydantic import BaseModel, Field

from app.schemas.card import CardThemeSchema


class GuestCardSchema(BaseModel):
    """Validated card shape stored inside a guest deck blob."""

    elements: list[dict[str, Any]]
    img_url: str = ""
    theme: CardThemeSchema


class GuestDeckSaveRequest(BaseModel):
    """Request body for ``PUT /api/decks/local/{deck_id}``."""

    cards: list[GuestCardSchema] = Field(default_factory=list)
    editing_cloud_deck_id: str | None = None
    editing_cloud_deck_title: str | None = None


class GuestDeckResponse(BaseModel):
    """Response body for ``GET /api/decks/local/{deck_id}`` and save responses."""

    id: str
    cards: list[dict[str, Any]]
    editing_cloud_deck_id: str | None
    editing_cloud_deck_title: str | None
