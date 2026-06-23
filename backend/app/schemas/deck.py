from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

from app.schemas.card import CardThemeSchema


class DeckCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    card_ids: list[str]


class DeckCardInput(BaseModel):
    id: str | None = None
    elements: list[dict[str, Any]]
    img_url: str
    theme: CardThemeSchema


class DeckSaveRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    cards: list[DeckCardInput]
    deck_id: str | None = None


class DeckUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    card_ids: list[str] | None = None


class DeckSummary(BaseModel):
    id: str
    title: str
    is_default: bool
    card_count: int
    first_card_img_url: str | None
    first_card_id: str | None
    share_slug: str | None
    share_mode: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DeckResponse(BaseModel):
    id: str
    user_id: str
    title: str
    is_default: bool
    cards: list[dict[str, Any]]
    share_slug: str | None
    share_mode: str | None
    share_at: datetime | None
    created_at: datetime
    updated_at: datetime


class DeckShareToggle(BaseModel):
    mode: Literal["view_only", "view_and_copy"]


class SharedDeckResponse(BaseModel):
    id: str
    title: str
    cards: list[dict[str, Any]]
    mode: str | None
    can_copy: bool


class CardDecksResponse(BaseModel):
    deck_id: str
    title: str
    is_default: bool


class CardDecksUpdate(BaseModel):
    deck_ids: list[str]
