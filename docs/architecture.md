# Architecture

## System Overview

DnD Card Maker is a **two-tier web application** with a React single-page frontend and a FastAPI REST backend, designed to run behind an Nginx reverse proxy in production.

```
┌─────────────────────────────────────────────────────────┐
│                      Client Browser                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │              React SPA (Vite + TypeScript)        │  │
│  │  ┌─────────┐ ┌──────────┐ ┌────────────────────┐  │  │
│  │  │ Editor  │ │  Deck    │ │ Cloud Sync / Share │  │  │
│  │  │ (Slate) │ │ (dnd-kit)│ │   (Axios + JWT)    │  │  │
│  │  └─────────┘ └──────────┘ └────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────┐ │  │
│  │  │         Zustand Stores (state management)    │ │  │
│  │  └──────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   Nginx Reverse Proxy                   │
│  /             → Frontend static files (SPA fallback)   │
│  /api/*        → Backend proxy_pass                     │
│  /api/proxy/*  → CORS image proxy (passthrough)         │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP (internal)
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  FastAPI Backend (Python)               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │  Auth    │ │  Cards   │ │  Decks   │ │  Sharing   │  │
│  │  Routes  │ │  Routes  │ │  Routes  │ │  Routes    │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬──────┘  │
│       │            │            │             │         │
│  ┌────┴────────────┴────────────┴─────────────┴───────┐ │
│  │              Service Layer (business logic)        │ │
│  └──────────────────────┬─────────────────────────────┘ │
│                         │                               │
│  ┌──────────────────────┴─────────────────────────────┐ │
│  │            SQLAlchemy ORM + SQLite                 │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Tech Stack

| Layer         | Technology         | Purpose                              |
| ------------- | ------------------ | ------------------------------------ |
| Framework     | React 19           | Component-based UI                   |
| Language      | TypeScript 5.9     | Type safety                          |
| Build         | Vite 7             | Dev server, HMR, production bundling |
| UI Components | MUI 7 + Emotion    | Design system, styled components     |
| State         | Zustand 5          | Lightweight stores                   |
| Rich Text     | Slate.js 0.123     | Card text editing                    |
| Drag & Drop   | @dnd-kit 6         | Deck sorting                         |
| Animation     | Framer Motion 12   | Deck stack, transitions              |
| Routing       | react-router-dom 7 | Client-side routes                   |
| HTTP          | Axios 1.18         | API client with interceptors         |
| Validation    | Zod 4              | Schema validation                    |
| PDF           | jsPDF 4            | Client-side PDF generation           |
| Image Capture | html-to-image      | DOM-to-PNG rendering                 |

### Component Tree

```
App
└── ErrorBoundary
    └── AppContent
        ├── NavBar (auth-aware navigation)
        ├── Routes
        │   ├── / → EditorPage
        │   │   ├── Card (ElementRefProvider context)
        │   │   │   ├── EditCard → BottomCardMenu
        │   │   │   │   └── [Element]* via ELEMENT_REGISTRY
        │   │   │   ├── PreviewCard → Background
        │   │   │   │   └── [ElementPreview]*
        │   │   │   └── CardButtons (save/cloud)
        │   │   ├── Deck (animated stack)
        │   │   └── DeckView (grid + dnd-kit)
        │   ├── /login → LoginPage
        │   ├── /register → RegisterPage (Turnstile)
        │   ├── /verify/:token → VerifyPage
        │   ├── /forgot-password → ForgotPasswordPage
        │   ├── /reset-password/:token → ResetPasswordPage
        │   ├── /settings → SettingsPage
        │   ├── /share/:slug → SharedCardPage
        │   └── /share/deck/:slug → SharedDeckPage
        ├── CloudDeckView (My Cards overlay)
        ├── CloudDeckListView (Decks overlay)
        ├── SaveDeckDialog (batch upload)
        ├── ExportModal (PDF export)
        └── GlobalSnackbar (notifications)
```

### State Management

Three Zustand stores manage application state:

| Store                 | File                            | Purpose                                                     |
| --------------------- | ------------------------------- | ----------------------------------------------------------- |
| `useActiveCardStore`  | `stores/useActiveCardStore.ts`  | Current card draft: elements, theme, card ID, cloud card ID |
| `useAuthStore`        | `stores/useAuthStore.ts`        | Auth state: user, tokens, login/register/checkAuth actions  |
| `useCloudCardMapping` | `stores/useCloudCardMapping.ts` | Maps local card IDs to cloud card IDs for save/update logic |

Additional state hooks:

- `useExportCards` — deck management (add/remove/load/export/PDF generation)
- `useSnackbar` — global notification queue
- `useResponsiveZoom` — viewport-aware CSS zoom calculation
- `useCardPalettes` — extracted color palettes from card images

### Element System

Elements use a **registry pattern** for extensibility:

```typescript
// Adding a new element type requires only:
// 1. A Zod schema for the element data
// 2. An editor component (for the interactive editor)
// 3. A preview component (for the rendered preview)
// 4. Register all three in ELEMENT_REGISTRY

const ELEMENT_REGISTRY = {
  text: { editor: TextEditor, preview: TextPreview },
  image: { editor: ImageEditor, preview: ImagePreview },
};
```

Elements are rendered polymorphically via the `Element.tsx` wrapper, which provides hover controls, menus, and context.

### Data Flow

1. User edits card → `useActiveCardStore` updates
2. Elements/theme are validated by Zod schemas at every change
3. Preview re-renders reactively from the same store
4. On "Save to Cloud": HTML-to-image captures the preview DOM → JPEG compression → POST to `/api/cards`
5. On "Save Local": card data added to `useExportCards` store's `cards` array
6. On export: `cards` array serialized to JSON or rendered to PDF

## Backend Architecture

### Tech Stack

| Layer            | Technology           | Purpose                                         |
| ---------------- | -------------------- | ----------------------------------------------- |
| Framework        | FastAPI 0.115        | Async REST API                                  |
| Server           | Uvicorn              | ASGI server                                     |
| ORM              | SQLAlchemy 2.0       | Database abstraction                            |
| Database         | SQLite               | File-based storage                              |
| Auth             | python-jose + bcrypt | JWT token creation/validation, password hashing |
| Rate Limiting    | slowapi              | Per-route rate limiting                         |
| Image Processing | Pillow               | Server-side image resizing                      |
| Validation       | Pydantic             | Request/response schemas                        |
| Config           | pydantic-settings    | Environment variable management                 |

### Application Structure

```
backend/app/
├── main.py              # FastAPI app creation, CORS, lifespan, router registration
├── config.py            # Pydantic Settings (reads .env)
├── database.py          # SQLAlchemy engine, session, init_db, migration
├── dependencies.py      # get_current_user (JWT decode + token_version check)
├── constants.py         # JWT algorithm, share modes, rate limits
├── limiter.py           # Shared slowapi Limiter instance
├── models/
│   ├── user.py          # User ORM model
│   ├── card.py          # Card ORM model
│   ├── deck.py          # Deck + DeckCard ORM models
│   └── email.py         # SentEmail ORM model
├── schemas/
│   ├── auth.py          # Token, refresh, message response schemas
│   ├── card.py          # Card create/update/response schemas
│   ├── deck.py          # Deck create/update/response schemas
│   └── user.py          # Register, login, settings schemas
├── routes/
│   ├── auth.py          # /api/auth/* — register, verify, login, refresh, password reset
│   ├── cards.py         # /api/cards/* — CRUD, share, toggle-save, deck assignment
│   ├── decks.py         # /api/decks/* — CRUD, save, batch upload, share
│   ├── share.py         # /api/shared/{slug} — public card view
│   ├── decks_share.py   # /api/shared/decks/{slug} — public deck view
│   ├── users.py         # /api/users/me/* — change password, update email, delete account
│   ├── images.py        # /api/images/{card_id} — resized image serving
│   ├── proxy.py         # /api/proxy/image — CORS image proxy
│   ├── admin.py         # /api/admin/* — dev-only DB browser
│   └── dev.py           # /api/dev/mail — dev-only email viewer
├── services/
│   ├── auth.py          # Password hashing, JWT create/decode
│   ├── email.py         # SMTP sender + DB storage
│   ├── card_service.py  # Card CRUD, share/unshare, toggle-save
│   └── deck_service.py  # Deck CRUD, batch save, deck-card management
├── utils/
│   ├── shared.py        # generate_share_slug (8-char URL-safe)
│   └── deck_helpers.py  # Default deck creation, orphan cleanup
└── templates/
    ├── verify_email.html
    └── reset_email.html
```

### Request Flow

```
Client Request
     │
     ▼
FastAPI Router
     │
     ├── Auth routes: no dependency
     ├── Shared routes: no dependency (public)
     └── Protected routes: Depends(get_current_user)
          │
          ▼
     dependencies.py
     ├── Extract Bearer token from Authorization header
     ├── Decode JWT → verify signature, expiry, token_version
     ├── Query User from DB
     └── Return User or raise 401
          │
          ▼
     Route handler → Service layer → DB operation → Response
```

### Auth Tokens

- **Access token**: `HS256` JWT, expires in 15 minutes. Contains `sub` (user ID), `email`, `token_version`.
- **Refresh token**: `HS256` JWT, expires in 7 days. Same claims.
- **Token version**: Integer on the User model. Incremented on password reset to invalidate all existing tokens.
- **Auto-refresh**: The frontend Axios interceptor catches 401 responses, queues pending requests while refreshing, then retries.

### Database Schema

```
┌──────────────────────────────────────────────────────────────────┐
│                           users                                  │
├──────────────────────────────────────────────────────────────────┤
│ id (UUID, PK)          │ email (unique)       │ password_hash    │
│ is_verified            │ verify_token         │ reset_token      │
│ reset_expires          │ token_version (int)  │ created_at       │
└──────────────────────────────────────────────────────────────────┘
                              │ 1
                              │
                              ▼ N
┌──────────────────────────────────────────────────────────────────┐
│                           cards                                  │
├──────────────────────────────────────────────────────────────────┤
│ id (UUID, PK)          │ user_id (FK→users)  │ title             │
│ elements (JSON text)   │ img_url (base64)    │ theme (JSON text) │
│ share_slug (unique)    │ share_mode           │ share_at         │
│ created_at             │ updated_at                              │
└──────────────────────────────────────────────────────────────────┘
         │ N                                      │ N
         │                                        │
         ▼ M                                      ▼ M
┌──────────────────────────────────────────────────────────────────┐
│                        deck_cards                                │
├──────────────────────────────────────────────────────────────────┤
│ deck_id (PK, FK→decks) │ card_id (PK, FK→cards) │ position       │
└──────────────────────────────────────────────────────────────────┘
         │
         │
         ▼ 1
┌──────────────────────────────────────────────────────────────────┐
│                           decks                                  │
├──────────────────────────────────────────────────────────────────┤
│ id (UUID, PK)          │ user_id (FK→users)  │ title             │
│ is_default             │ share_slug (unique) │ share_mode        │
│ share_at               │ created_at          │ updated_at        │
└──────────────────────────────────────────────────────────────────┘
```

- `users` ↔ `cards`: One-to-many (a user owns many cards)
- `decks` ↔ `cards`: Many-to-many via `deck_cards` junction table
- `users` ↔ `decks`: One-to-many (a user owns many decks)
- Each user gets one **default deck** ("My Cards") auto-created on first card save
- Orphaned cards (not in any deck) are automatically cleaned up

## Container Architecture

```
podman-compose.yml
├── frontend (Nginx Alpine)
│   ├── Serves static React build from /usr/share/nginx/html
│   ├── SPA fallback: all non-/api routes → index.html
│   ├── /api/* → proxy_pass to backend:8000
│   └── Health: depends on backend healthy
│
└── backend (Python + Uvicorn)
    ├── Runs uvicorn app.main:app --host 0.0.0.0 --port 8000
    ├── SQLite data persisted via db_data volume
    ├── Healthcheck: GET /api/health
    └── Reads .env via env_file
```

## Key Design Decisions

**SQLite over PostgreSQL**: The app targets self-hosters and small communities. SQLite eliminates the need for a separate database container, simplifies backups (single file), and is more than sufficient for the expected scale.

**Zod + Pydantic dual validation**: Frontend uses Zod to validate data at the UI boundary (card schemas, deck imports). Backend uses Pydantic for API request/response validation. Both represent the same data shapes.

**Query-param token for images**: `<img>` tags cannot send `Authorization` headers. The image serving endpoint supports `?token=` as an alternative auth method for embedding card images in shared views and `<img>` tags.

**Token versioning**: On password reset, the `token_version` field increments on the user row. All issued tokens contain the version at issue time. This invalidates all existing sessions without maintaining a token blacklist.

**Base-path awareness**: Every URL construction in the frontend respects `import.meta.env.BASE_URL`. Nginx config uses placeholder tokens (`__WITH_SLASH__` / `__NO_SLASH__`) replaced during the container build by `sed`, supporting both root and subdirectory deployments.

**Batch deck uploads**: Large decks (50+ cards) exceed request size limits. The frontend uploads cards in batches of 10 via `POST /api/decks/save/cards`, then links them to the deck with card IDs.
