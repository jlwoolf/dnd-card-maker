"""Shared utility functions used across multiple route/service modules."""

import secrets

from app.constants import SHARE_SLUG_BYTES


def generate_share_slug() -> str:
    """Generate a unique URL-safe share slug.

    Uses ``secrets.token_urlsafe`` seeded with ``SHARE_SLUG_BYTES`` to produce
    a short, unguessable string suitable for public share URLs.
    """
    return secrets.token_urlsafe(SHARE_SLUG_BYTES)
