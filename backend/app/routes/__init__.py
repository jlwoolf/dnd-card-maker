from app.routes.admin import router as admin_router
from app.routes.auth import router as auth_router
from app.routes.cards import router as cards_router
from app.routes.decks import router as decks_router
from app.routes.decks_share import router as decks_share_router
from app.routes.dev import router as dev_router
from app.routes.guest_decks import router as guest_decks_router
from app.routes.images import router as images_router
from app.routes.proxy import router as proxy_router
from app.routes.share import router as share_router
from app.routes.users import router as users_router

__all__ = [
    "admin_router",
    "auth_router",
    "cards_router",
    "decks_router",
    "decks_share_router",
    "dev_router",
    "guest_decks_router",
    "images_router",
    "proxy_router",
    "share_router",
    "users_router",
]
