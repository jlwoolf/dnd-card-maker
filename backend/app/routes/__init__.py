from app.routes.auth import router as auth_router
from app.routes.cards import router as cards_router
from app.routes.share import router as share_router
from app.routes.dev import router as dev_router
from app.routes.decks import router as decks_router
from app.routes.decks_share import router as decks_share_router

__all__ = ["auth_router", "cards_router", "share_router", "dev_router", "decks_router", "decks_share_router"]
