"""Image serving endpoint with dynamic resizing.

Returns scaled card images. Auth is validated via a ``token`` query
parameter because ``<img>`` tags cannot send Authorization headers.
If no token is provided the card is only served when it has been
publicly shared (has a non-null ``share_slug``).
"""

import io
from base64 import b64decode
from functools import lru_cache

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from PIL import Image
from sqlalchemy.orm import Session

from app.config import settings
from app.constants import TOKEN_TYPE_ACCESS
from app.database import get_db
from app.models.card import Card
from app.services.auth import validate_token_and_get_user

router = APIRouter(prefix="/api/images", tags=["images"])

# 1×1 transparent PNG — returned as a placeholder when a card has no stored image.
_PLACEHOLDER_PNG = bytes([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
    0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0D, 0x0A, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,
    0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82,
])


@lru_cache(maxsize=256)
def _resize_image(img_bytes: bytes, scale: float) -> bytes:
    """Decode, resize, and re-encode a card image. Cached by input bytes + scale."""
    img = Image.open(io.BytesIO(img_bytes))
    if scale < 1.0:
        new_size = (int(img.width * scale), int(img.height * scale))
        img.thumbnail(new_size, Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _serve_card_image(card: Card, scale: float) -> Response:
    """Serve a resized card image from its data URL.

    When the card has no stored image a 1×1 transparent PNG placeholder
    is returned so the client never sees a 400 error.
    """
    if not card.img_url or not card.img_url.startswith("data:image/"):
        return Response(
            content=_PLACEHOLDER_PNG,
            media_type="image/png",
            headers={"Cache-Control": "public, max-age=31536000, immutable"},
        )
    header, encoded = card.img_url.split(",", 1)
    img_bytes = b64decode(encoded)
    resized = _resize_image(img_bytes, scale)
    return Response(
        content=resized,
        media_type="image/png",
        headers={
            "Cache-Control": "public, max-age=31536000, immutable",
        },
    )


@router.get("/{card_id}")
def get_card_image(
    card_id: str,
    scale: float = Query(0.25, ge=0.05, le=1.0),
    token: str | None = Query(None),
    db: Session = Depends(get_db),
):
    """Serve a scaled card image (auth via query param for ``<img>`` compatibility).

    When a valid token is provided the image is served after standard auth
    checks.  When no token (or an invalid token) is provided the card is
    only served if it is publicly shared (has a non-null ``share_slug``).
    """
    if token:
        user = validate_token_and_get_user(
            token, TOKEN_TYPE_ACCESS, settings.jwt_secret, db
        )
        if user is not None:
            card = db.query(Card).filter(Card.id == card_id).first()
            if not card:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="Card not found"
                )
            return _serve_card_image(card, scale)

    # No (valid) token — allow access only for publicly shared cards
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")

    if card.share_slug is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to view this card image",
        )

    return _serve_card_image(card, scale)
