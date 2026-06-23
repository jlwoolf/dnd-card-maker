"""Shared utility functions used across multiple route/service modules."""

import secrets
from datetime import UTC, datetime

from app.constants import SHARE_SLUG_BYTES


def generate_share_slug() -> str:
    """Generate a unique URL-safe share slug.

    Uses ``secrets.token_urlsafe`` seeded with ``SHARE_SLUG_BYTES`` to produce
    a short, unguessable string suitable for public share URLs.
    """
    return secrets.token_urlsafe(SHARE_SLUG_BYTES)


def apply_share(entity, mode: str) -> None:
    """Set share fields on a card or deck entity.

    Assigns a new ``share_slug`` via ``generate_share_slug``, sets the
    ``share_mode`` to *mode*, and records the current UTC time in ``share_at``.
    """
    entity.share_slug = generate_share_slug()
    entity.share_mode = mode
    entity.share_at = datetime.now(UTC)


def remove_share(entity) -> None:
    """Clear all share fields on a card or deck entity."""
    entity.share_slug = None
    entity.share_mode = None
    entity.share_at = None
