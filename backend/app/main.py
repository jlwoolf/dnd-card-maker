import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.database import init_db
from app.limiter import limiter
from app.routes import (
    admin_router,
    auth_router,
    cards_router,
    decks_router,
    decks_share_router,
    dev_router,
    images_router,
    proxy_router,
    share_router,
    users_router,
)

_level = getattr(logging, settings.log_level.upper(), logging.WARNING)
logging.basicConfig(
    level=_level,
    format="%(asctime)s %(levelname)-8s [%(name)s] %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
    stream=sys.stderr,
)
logging.getLogger("uvicorn").setLevel(max(_level, logging.INFO))
logging.getLogger("uvicorn.access").setLevel(_level)

log = logging.getLogger(__name__)
log.info("Log level set to %s", settings.log_level.upper())


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="DnD Card Maker API",
    version="0.1.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, exc: RequestValidationError):
    """Return clean 422 responses for invalid request bodies."""
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request: Request, exc: Exception):
    """Catch-all for unhandled exceptions — return 500 with a generic message."""
    log.exception("Unhandled exception: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )

app.include_router(auth_router)
app.include_router(cards_router)
app.include_router(share_router)
app.include_router(decks_router)
app.include_router(decks_share_router)
app.include_router(images_router)
app.include_router(proxy_router)
app.include_router(users_router)

if settings.dev_mail_enabled:
    app.include_router(dev_router)
    app.include_router(admin_router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
