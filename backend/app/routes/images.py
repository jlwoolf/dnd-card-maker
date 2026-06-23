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
    """Serve a resized card image from its data URL."""
    if not card.img_url.startswith("data:image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported image format"
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
