# API Reference

Base URL: `http://localhost:8000` (development) or your deployed backend URL.

All endpoints accept and return JSON. Authenticated endpoints require an `Authorization: Bearer <access-token>` header.

## Authentication

### POST `/api/auth/register`

Create a new user account. Sends a verification email.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "secure-password",
  "turnstile_token": "cf-token" // optional, omitted if CAPTCHA disabled
}
```

**Response** `201`:

```json
{
  "message": "Registration successful. Please check your email to verify your account."
}
```

---

### GET `/api/auth/verify/{token}`

Verify an email address using the token sent after registration.

**Response** `200`:

```json
{
  "message": "Email verified successfully. You can now log in."
}
```

---

### POST `/api/auth/login`

Authenticate and receive JWT tokens.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "secure-password"
}
```

**Response** `200`:

```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

---

### POST `/api/auth/refresh`

Exchange a refresh token for new access and refresh tokens.

**Request Body:**

```json
{
  "refresh_token": "eyJ..."
}
```

**Response** `200`:

```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

---

### POST `/api/auth/forgot-password`

Request a password reset email.

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response** `200`:

```json
{
  "message": "If the email exists, a password reset link has been sent."
}
```

---

### POST `/api/auth/reset-password/{token}`

Reset password using the token from the reset email. Also verifies the email if not already verified.

**Request Body:**

```json
{
  "password": "new-secure-password"
}
```

**Response** `200`:

```json
{
  "message": "Password reset successfully."
}
```

---

## Cards

All card endpoints require authentication.

### GET `/api/cards`

List the current user's cards in their default deck.

**Response** `200`:

```json
[
  {
    "id": "uuid",
    "title": "My Card",
    "img_url": "data:image/jpeg;base64,...",
    "saved": true,
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z",
    "share_slug": "abc12345",
    "share_mode": "view_only"
  }
]
```

---

### POST `/api/cards`

Create a new card and add it to the user's default deck.

**Request Body:**

```json
{
  "elements": [
    {
      "type": "text",
      "variant": "banner",
      "content": [{ "type": "paragraph", "children": [{ "text": "Hello" }] }],
      "fontSize": 16,
      "alignment": "center",
      "grow": false
    },
    {
      "type": "image",
      "src": "https://example.com/image.png",
      "radius": 0,
      "width": 100
    }
  ],
  "img_url": "data:image/jpeg;base64,...",
  "theme": {
    "fill": "#FFF8E7",
    "banner_fill": "#8B0000",
    "box_fill": "#FFF8E7",
    "stroke": "#8B0000",
    "banner_text": "#FFFFFF",
    "box_text": "#000000"
  },
  "title": "My Card"
}
```

**Response** `201`: Returns the created `CardResponse`.

---

### GET `/api/cards/{id}`

Get a full card by ID.

**Response** `200`: `CardResponse` with `id`, `elements`, `img_url`, `theme`, `share_slug`, `share_mode`, `share_at`, `title`, `created_at`, `updated_at`.

---

### PUT `/api/cards/{id}`

Update a card.

**Request Body:** Same shape as `POST /api/cards` (partial updates allowed).

**Response** `200`: Updated `CardResponse`.

---

### DELETE `/api/cards/{id}`

Delete a card. Removes it from all decks. If it was the last remaining deck membership, the card is permanently deleted.

**Response** `204 No Content` (no response body).

---

### POST `/api/cards/{id}/share`

Create or update a share link for a card.

**Request Body:**

```json
{
  "mode": "view_only"
}
```

Valid modes: `"view_only"`, `"view_and_copy"`.

**Response** `200`: Returns the full `CardResponse` including the newly generated `share_slug`.

---

### DELETE `/api/cards/{id}/share`

Remove a card's share link. The card becomes private.

**Response** `204 No Content` (no response body).

---

### POST `/api/cards/{id}/toggle-save`

Toggle a card's presence in the user's default deck. If the card is not in the default deck, it is added. If it is, it is removed (and possibly orphaned/deleted).

**Response** `200`:

```json
{
  "saved": true
}
```

---

### GET `/api/cards/{id}/decks`

List all decks that contain this card.

**Response** `200`:

```json
{
  "decks": [{ "id": "uuid", "title": "My Cards", "is_default": true }]
}
```

---

### PUT `/api/cards/{id}/decks`

Replace the deck assignments for a card.

**Request Body:**

```json
{
  "deck_ids": ["uuid1", "uuid2"]
}
```

**Response** `204 No Content` (no response body).

---

## Decks

All deck endpoints require authentication.

### GET `/api/decks`

List the current user's decks. Includes card counts.

**Response** `200`:

```json
[
  {
    "id": "uuid",
    "title": "My Cards",
    "is_default": true,
    "card_count": 5,
    "share_slug": "xyz98765",
    "share_at": null,
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
]
```

---

### POST `/api/decks`

Create a new deck, optionally with cards.

**Request Body:**

```json
{
  "title": "Spell Cards",
  "card_ids": ["uuid1", "uuid2"]
}
```

**Response** `201`: `DeckResponse`.

---

### POST `/api/decks/save`

Save or update a full deck with cards. Cards can be provided as full objects (with or without IDs) or as existing card IDs.

**Request Body:**

```json
{
  "title": "My Deck",
  "deck_id": "uuid",
  "cards": [
    {
      "id": "existing-card-uuid",
      "elements": [...],
      "img_url": "data:...",
      "theme": {...}
    }
  ]
}
```

**Response** `200`: `DeckResponse`.

---

### POST `/api/decks/save/cards`

Batch upload cards only (max 10 per request). Cards are created or updated and returned with their IDs. Use this endpoint for large decks to avoid request size limits, then link them to a deck via `PUT /api/cards/{id}/decks` or `POST /api/decks`.

**Request Body:**

```json
[
  {
    "elements": [...],
    "img_url": "data:...",
    "theme": {...}
  }
]
```

**Response** `200`:

```json
{
  "card_ids": ["uuid1", "uuid2"]
}
```

---

### GET `/api/decks/autosave`

Get the current user's auto-saved deck. Returns `null` if no autosave exists yet.

**Response** `200`: `DeckResponse` or `null`.

---

### PUT `/api/decks/autosave`

Save or update the user's auto-saved deck. The autosave deck is hidden from the normal deck listing and persists across sessions. Each user has exactly one autosave deck.

**Request Body:**

```json
{
  "cards": [
    {
      "id": "existing-card-uuid",
      "elements": [...],
      "img_url": "data:...",
      "theme": {...}
    }
  ]
}
```

**Response** `201`: `DeckResponse`.

---

### GET `/api/decks/{id}`

Get a deck with its cards.

**Response** `200`: `DeckResponse` including `cards` array of `CardSummary` objects.

---

### PUT `/api/decks/{id}`

Update a deck's title and/or card list.

**Request Body:**

```json
{
  "title": "Updated Title",
  "card_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Response** `200`: Updated `DeckResponse`.

---

### DELETE `/api/decks/{id}`

Delete a deck. The default deck cannot be deleted. Cards are only deleted if they become orphaned (not in any other deck).

**Response** `204 No Content` (no response body).

---

### POST `/api/decks/{id}/share`

Share a deck.

**Request Body:**

```json
{
  "mode": "view_and_copy"
}
```

**Response** `200`: Returns the full `DeckResponse` including the newly generated `share_slug`.

---

### DELETE `/api/decks/{id}/share`

Remove a deck's share link.

**Response** `204 No Content` (no response body).

---

## Shared (Public)

No authentication required.

### GET `/api/shared/{slug}`

View a publicly shared card by its share slug.

**Response** `200`: `SharedCardResponse` with `elements`, `img_url`, `theme`, `share_mode`, `title`.

---

### GET `/api/shared/decks/{slug}`

View a publicly shared deck by its share slug.

**Response** `200`: `SharedDeckResponse` with deck metadata and `cards` array.

---

## Images

### GET `/api/images/{card_id}?scale=0.25&token=`

Serve a resized version of a card's image. Authentication can be provided via:

- `Authorization: Bearer <token>` header (standard)
- `?token=<access-token>` query parameter (for `<img>` tags)

Public shared cards do not require authentication.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `scale` | float | Scale factor (e.g. `0.25` for 1/4 size). Default: `1.0`. |
| `token` | string | JWT access token for auth (alternative to header). |

**Response** `200`: Binary image data with `Content-Type: image/jpeg`.

---

## Proxy

### GET `/api/proxy/image?url=`

Fetch an image from a remote URL, bypassing CORS restrictions. Used by the frontend to avoid canvas tainting during HTML-to-image capture.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | string | The remote image URL to fetch. Must be URL-encoded. |

**Limits:**

- Maximum response size: 10 MB
- Loopback addresses (127.0.0.1, localhost, etc.) are blocked for security

**Response** `200`: Binary image data with permissive CORS headers.

---

## Users

All user endpoints require authentication.

### POST `/api/users/me/change-password`

Change the current user's password. Increments `token_version` which invalidates all existing tokens (user must re-login).

**Request Body:**

```json
{
  "current_password": "old-password",
  "new_password": "new-secure-password"
}
```

**Response** `200`:

```json
{
  "message": "Password changed successfully. Please log in again."
}
```

---

### PUT `/api/users/me/email`

Update the current user's email address.

**Request Body:**

```json
{
  "email": "new-email@example.com",
  "password": "current-password"
}
```

**Response** `200`:

```json
{
  "message": "Email updated successfully"
}
```

---

### DELETE `/api/users/me`

Permanently delete the current user's account and all associated data (cards, decks, deck associations).

**Request Body:**

```json
{
  "password": "current-password"
}
```

**Response** `200`:

```json
{
  "message": "Account deleted successfully"
}
```

---

## Dev Endpoints

Only available when `DEV_MAIL_ENABLED=true`. All dev endpoints require an
`X-Dev-Auth` header set to the server's `JWT_SECRET` value.
Without this header, the endpoints return `404` (as if they don't exist).

### GET `/api/dev/mail`

List all sent emails (verification, password reset).

**Response** `200`:

```json
[
  {
    "id": 1,
    "to_email": "user@example.com",
    "subject": "Verify your email",
    "sent_at": "2025-01-01T00:00:00Z"
  }
]
```

---

### GET `/api/dev/mail/{id}`

Get the full HTML content of a sent email.

**Response** `200`: JSON with `html_body` field containing the email HTML.

---

### DELETE `/api/dev/mail`

Clear all stored emails.

**Response** `200`:

```json
{
  "message": "All emails deleted"
}
```

---

### GET `/api/admin/tables`

List all database tables.

**Response** `200`:

```json
{
  "tables": ["users", "cards", "decks", "deck_cards", "sent_emails"]
}
```

---

### GET `/api/admin/{table}?limit=50&offset=0`

List rows from a database table with pagination.

**Response** `200`:

```json
{
  "rows": [...],
  "total": 100,
  "limit": 50,
  "offset": 0
}
```

---

## Common Error Responses

| Status | When                                            |
| ------ | ----------------------------------------------- |
| `400`  | Validation error (missing fields, invalid data) |
| `401`  | Missing or invalid/expired authentication token |
| `403`  | Attempting to access another user's resources   |
| `404`  | Resource not found                              |
| `413`  | Request body too large                          |
| `422`  | Request validation failed (Pydantic)            |
| `429`  | Rate limit exceeded                             |
| `500`  | Unhandled internal server error                 |

### Error Response Format

```json
{
  "detail": "Human-readable error message"
}
```

For `422` validation errors the `detail` field contains Pydantic error entries:

```json
{
  "detail": [
    {
      "loc": ["body", "field_name"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

---

## Rate Limits

| Scope    | Limit      | Applies To              |
| -------- | ---------- | ----------------------- |
| Global   | 60 req/min | All endpoints           |
| Auth     | 5 req/min  | `/api/auth/*` endpoints |
| Register | 3 req/min  | `/api/auth/register`    |

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 30
```
