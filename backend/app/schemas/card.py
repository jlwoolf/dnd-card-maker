from datetime import datetime
from typing import Any

from pydantic import BaseModel


class CardThemeSchema(BaseModel):
    fill: str
    banner_fill: str
    box_fill: str
    stroke: str
    banner_text: str
    box_text: str


class CardCreate(BaseModel):
    title: str | None = None
    elements: list[dict[str, Any]]
    img_url: str
    theme: CardThemeSchema


class CardUpdate(BaseModel):
    title: str | None = None
    elements: list[dict[str, Any]] | None = None
    img_url: str | None = None
    theme: CardThemeSchema | None = None


class CardSummary(BaseModel):
    id: str
    title: str | None
    created_at: datetime
    updated_at: datetime
    share_slug: str | None
    share_mode: str | None

    model_config = {"from_attributes": True}


class CardResponse(BaseModel):
    id: str
    user_id: str
    title: str | None
    elements: list[dict[str, Any]]
    img_url: str
    theme: CardThemeSchema
    share_slug: str | None
    share_mode: str | None
    share_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ShareToggle(BaseModel):
    mode: str  # "view_only" | "view_and_copy"


class SharedCardResponse(BaseModel):
    id: str
    title: str | None
    elements: list[dict[str, Any]]
    img_url: str
    theme: CardThemeSchema
    mode: str | None
    can_copy: bool
