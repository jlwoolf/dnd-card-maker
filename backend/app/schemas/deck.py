from datetime import datetime
from typing import Any

from pydantic import BaseModel


class DeckCreate(BaseModel):
    title: str
    card_ids: list[str]


class DeckCardInput(BaseModel):
    id: str | None = None
    elements: list[dict[str, Any]]
    img_url: str
    theme: dict[str, str]


class DeckSaveRequest(BaseModel):
    title: str
    cards: list[DeckCardInput]


class DeckUpdate(BaseModel):
    title: str | None = None
    card_ids: list[str] | None = None


class DeckSummary(BaseModel):
    id: str
    title: str
    is_default: bool
    card_count: int
    first_card_img_url: str | None
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
    mode: str


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
