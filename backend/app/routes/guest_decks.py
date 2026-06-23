"""Guest (unauthenticated) deck auto-save endpoints.

These endpoints allow guest users to persist their deck to the backend
without creating an account.  Only a small UUID is stored in the
browser's ``localStorage``; the full payload lives on the server and is
automatically cleaned up after 30 days of inactivity.
"""

from fastapi import APIRouter, HTTPException, status

from app.dependencies import DBSession
from app.schemas.guest_deck import GuestDeckResponse, GuestDeckSaveRequest
from app.services.guest_deck_service import (
    get_guest_deck,
    guest_deck_to_response,
    save_guest_deck,
)

router = APIRouter(prefix="/api/decks/local", tags=["guest-decks"])


@router.put("/{deck_id}", response_model=GuestDeckResponse, status_code=status.HTTP_201_CREATED)
def save_guest_deck_endpoint(
    deck_id: str,
    body: GuestDeckSaveRequest,
    db: DBSession,
):
    """Create or update a guest deck.  No authentication required."""
    deck = save_guest_deck(deck_id, body, db)
    return guest_deck_to_response(deck)


@router.get("/{deck_id}", response_model=GuestDeckResponse)
def get_guest_deck_endpoint(
    deck_id: str,
    db: DBSession,
):
    """Retrieve a guest deck by ID.  No authentication required."""
    deck = get_guest_deck(deck_id, db)
    if not deck:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guest deck not found")
    return guest_deck_to_response(deck)
