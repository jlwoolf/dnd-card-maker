"""Image proxy endpoint — fetches remote images server-side to avoid
browser CORS restrictions when capturing cards via canvas.

Only ``http`` and ``https`` URLs are permitted. The response includes
a short-lived ``Cache-Control`` header so the browser's
``ImageProcessor`` fetch succeeds on the same image during capture.
"""

import urllib.request
from urllib.parse import urlparse

from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import Response

router = APIRouter(prefix="/api/proxy", tags=["proxy"])

MAX_SIZE = 10 * 1024 * 1024  # 10 MB


@router.get("/image")
def proxy_image(url: str = Query(..., description="Remote image URL to fetch")):
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only http/https URLs are supported",
        )
    if parsed.hostname in ("localhost", "127.0.0.1", "::1"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Loopback addresses are not allowed",
        )

    req = urllib.request.Request(url, headers={"User-Agent": "DnDCardMaker/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            content_type = resp.headers.get("Content-Type", "image/png")
            body = resp.read(MAX_SIZE)
            if len(body) >= MAX_SIZE:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail="Image exceeds 10 MB limit",
                )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch image: {e}",
        ) from None

    return Response(
        content=body,
        media_type=content_type.split(";")[0].strip(),
        headers={"Cache-Control": "public, max-age=300"},
    )
