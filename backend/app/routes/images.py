"""Image serving endpoint with dynamic resizing.

Returns scaled card images. Auth is validated via a ``token`` query
parameter because ``<img>`` tags cannot send Authorization headers.
"""

import io
from base64 import b64decode
from functools import lru_cache

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from jose import JWTError
from PIL import Image
from sqlalchemy.orm import Session

from app.config import settings
from app.constants import TOKEN_TYPE_ACCESS
from app.database import get_db
from app.models.card import Card
from app.services.auth import decode_token, get_user_id_from_token

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


@router.get("/{card_id}")
def get_card_image(
    card_id: str,
    scale: float = Query(0.25, ge=0.05, le=1.0),
    token: str = Query(...),
    db: Session = Depends(get_db),
):
    """Serve a scaled card image (auth via query param for ``<img>`` compatibility)."""
    try:
        user_id = get_user_id_from_token(token, TOKEN_TYPE_ACCESS, settings.jwt_secret)
        payload = decode_token(token, settings.jwt_secret)
    except (JWTError, ValueError) as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        ) from err

    from app.models.user import User

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    token_version = payload.get("tv")
    if token_version is not None and user.token_version != token_version:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token version mismatch"
        )

    if not user.is_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Email not verified")

    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")

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
