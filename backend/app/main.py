from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
    share_router,
    users_router,
)


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

app.include_router(auth_router)
app.include_router(cards_router)
app.include_router(share_router)
app.include_router(decks_router)
app.include_router(decks_share_router)
app.include_router(images_router)
app.include_router(users_router)

if settings.dev_mail_enabled:
    app.include_router(dev_router)
    app.include_router(admin_router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
