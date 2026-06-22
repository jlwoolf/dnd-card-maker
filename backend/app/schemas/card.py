from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class CardThemeSchema(BaseModel):
    """Visual theme configuration for a card.

    All fields are hex color strings (e.g., '#ff0000').
    """

    fill: str
    banner_fill: str = Field(alias="bannerFill")
    box_fill: str = Field(alias="boxFill")
    stroke: str
    banner_text: str = Field(alias="bannerText")
    box_text: str = Field(alias="boxText")

    model_config = ConfigDict(populate_by_name=True)


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
    img_url: str
    saved: bool = True
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
    mode: Literal["view_only", "view_and_copy"]


class SharedCardResponse(BaseModel):
    id: str
    title: str | None
    elements: list[dict[str, Any]]
    img_url: str
    theme: CardThemeSchema
    mode: str | None
    can_copy: bool
