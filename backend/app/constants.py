"""Application-wide constants to eliminate magic strings and numbers.

All hardcoded values that appear in multiple locations are defined here
so they can be imported rather than duplicated.
"""

# --- Deck defaults ---
DEFAULT_DECK_TITLE = "My Cards"
AUTOSAVE_DECK_TITLE = "__autosave__"

# --- JWT configuration ---
JWT_ALGORITHM = "HS256"
TOKEN_TYPE_ACCESS = "access"
TOKEN_TYPE_REFRESH = "refresh"

# --- Share modes ---
SHARE_MODE_VIEW_ONLY = "view_only"
SHARE_MODE_VIEW_AND_COPY = "view_and_copy"

# --- Password validation ---
MIN_PASSWORD_LENGTH = 8
MAX_PASSWORD_LENGTH = 128

# --- Rate limiting ---
GLOBAL_RATE_LIMIT = "60/minute"
AUTH_RATE_LIMIT = "5/minute"
REGISTER_RATE_LIMIT = "3/minute"

# --- Share slug generation ---
SHARE_SLUG_BYTES = 6  # produces 8 URL-safe base64 characters

# --- Email listing ---
DEV_MAIL_LIST_LIMIT = 50

# --- Admin defaults ---
ADMIN_DEFAULT_LIMIT = 100

# --- Password reset expiry ---
RESET_TOKEN_EXPIRY_HOURS = 1
