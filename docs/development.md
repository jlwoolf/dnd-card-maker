# Development Guide

This guide covers setting up a local development environment, running tests, and understanding the codebase.

## Prerequisites

- **Node.js** 22+ with npm
- **Python** 3.12+
- **uv** ([install](https://docs.astral.sh/uv/getting-started/installation/))
- **Podman** + podman-compose (optional, for containerized dev)

## Local Setup

### 1. Clone and Configure

```bash
git clone https://github.com/jlwoolf/dnd-card-maker.git
cd dnd-card-maker
cp .env.example .env
# Set JWT_SECRET in .env
```

### 2. Backend

```bash
cd backend
uv sync --all-extras

# Run the server with hot reload
JWT_SECRET=your-secret uv run uvicorn app.main:app --reload --port 8000
```

The API is available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### 3. Frontend

```bash
cd frontend
npm install

# Start Vite dev server with HMR
npm run dev
```

The app is available at `http://localhost:5173`. Vite proxies `/api` requests to `http://localhost:8000` (override with `VITE_API_TARGET` in `.env`).

### 4. Containerized Dev (Alternative)

```bash
podman compose -f podman-compose.dev.yml up
```

Both services run with bind mounts for live editing. Frontend at `http://localhost:5173`, backend at `http://localhost:8000`.

## Testing

### Backend Tests (pytest)

```bash
cd backend

# Run all tests
uv run pytest -v

# Run a specific test file
uv run pytest -v tests/test_api.py

# Run with coverage
uv run pytest --cov=app --cov-report=term-missing
```

Tests use a temporary in-memory SQLite database. No SMTP or `.env` configuration needed.

**Test structure:**

- `tests/conftest.py` — Fixtures: FastAPI TestClient, auth headers, card/deck factories
- `tests/test_api.py` — Integration tests for all routes
- `tests/test_auth_service.py` — Unit tests for auth utilities
- `tests/test_card_service.py` — Unit tests for card service
- `tests/test_deck_service.py` — Unit tests for deck service
- `tests/test_dependencies.py` — Unit tests for auth dependency
- `tests/test_utils.py` — Unit tests for utility functions

### Frontend Tests

```bash
cd frontend

# Unit tests (Vitest, jsdom)
npm run test

# Watch mode
npm run test:watch

# E2E tests (Playwright)
npm run test:e2e

# E2E with UI
npm run test:e2e:ui

# Storybook (component development)
npm run storybook
```

**Test structure:**

- `src/__tests__/` — Unit tests for components, schemas, services, stores
- `e2e/` — Playwright E2E specs (deck, elements, global, interactions)
- `.storybook/` — Storybook configuration and stories

### Container Test Stage

The backend Containerfile includes a `test` target:

```bash
cd backend
podman build --target test -t dnd-card-backend-test -f Containerfile .
```

## Linting and Formatting

### Backend

```bash
cd backend

# Check linting
uv run ruff check

# Auto-fix
uv run ruff check --fix

# Format
uv run ruff format
```

Rules are configured in `backend/pyproject.toml` (pycodestyle, Pyflakes, isort, bugbear, pyupgrade, etc.).

### Frontend

```bash
cd frontend

# Lint
npm run lint

# Type check (also runs during build)
npx tsc -b
```

ESLint flat config with TypeScript, react-hooks, and react-refresh plugins.

## Project Structure

```
dnd-card-maker/
├── .env.example                  # All environment variables
├── podman-compose.yml             # Production compose
├── podman-compose.dev.yml         # Dev compose
├── frontend/
│   ├── Containerfile              # Multi-stage: build → Nginx serve
│   ├── Containerfile.dev          # Dev: Vite HMR
│   ├── nginx.conf                 # SPA fallback + API proxy
│   ├── vite.config.ts             # Build config + test projects
│   ├── eslint.config.js
│   ├── playwright.config.ts
│   ├── package.json
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx               # React entry
│   │   ├── App.tsx                # Router + routes
│   │   ├── components/
│   │   │   ├── Card/              # Card editor, preview, elements
│   │   │   │   ├── Component.tsx  # Main card container
│   │   │   │   ├── EditCard.tsx   # Interactive editor
│   │   │   │   ├── BaseCard.tsx   # Card frame (5:7 ratio)
│   │   │   │   ├── CardButtons.tsx
│   │   │   │   ├── CardMenu.tsx   # Element settings toolbar
│   │   │   │   ├── BottomCardMenu.tsx  # Insert, color, reset
│   │   │   │   ├── Element/
│   │   │   │   │   ├── registry.ts    # Element type registry
│   │   │   │   │   ├── Element.tsx     # Polymorphic wrapper
│   │   │   │   │   ├── Text/          # Slate.js editor
│   │   │   │   │   ├── Image/         # Image editor
│   │   │   │   │   └── Menu/          # Floating element menu
│   │   │   │   └── Preview/           # Preview renderer
│   │   │   ├── Deck/              # Deck stack (Framer Motion)
│   │   │   ├── DeckView/          # Sortable grid (dnd-kit)
│   │   │   ├── Cloud/             # Cloud sync views
│   │   │   ├── ExportModal/       # PDF export
│   │   │   ├── Color/             # Color picker + palette
│   │   │   └── NavBar.tsx
│   │   ├── pages/                 # Route-level components
│   │   ├── stores/                # Zustand stores
│   │   ├── services/              # API client, image processing
│   │   ├── hooks/                 # Custom hooks
│   │   ├── schemas/               # Zod schemas + types
│   │   └── utils/                 # Helpers
│   ├── __tests__/                 # Vitest unit tests
│   ├── e2e/                       # Playwright E2E tests
│   └── .storybook/                # Storybook config
├── backend/
│   ├── Containerfile              # Multi-stage: deps → test → production
│   ├── Containerfile.dev
│   ├── pyproject.toml
│   ├── uv.lock
│   ├── app/
│   │   ├── main.py                # FastAPI app, CORS, router registration
│   │   ├── config.py              # Pydantic Settings
│   │   ├── database.py            # SQLAlchemy engine + session
│   │   ├── dependencies.py        # get_current_user
│   │   ├── constants.py           # App-wide constants
│   │   ├── limiter.py             # Rate limiter
│   │   ├── models/                # SQLAlchemy ORM models
│   │   ├── schemas/               # Pydantic request/response schemas
│   │   ├── routes/                # API route modules
│   │   ├── services/              # Business logic
│   │   ├── utils/                 # Helpers
│   │   └── templates/             # Email HTML templates
│   └── tests/                     # pytest tests
└── docs/                          # Documentation
```

## Adding Features

### Adding a New Element Type

1. Create a Zod schema in `frontend/src/schemas/elements.ts`
2. Create an editor component in `frontend/src/components/Card/Element/YourType/`
3. Create a preview component in `frontend/src/components/Card/Preview/`
4. Register both in `frontend/src/components/Card/Element/registry.ts`

### Adding a New API Endpoint

1. Add Pydantic schemas in `backend/app/schemas/`
2. Create or extend a route module in `backend/app/routes/`
3. Add service functions in `backend/app/services/`
4. Register the router in `backend/app/main.py`
5. Add tests in `backend/tests/`

## Vite Build

The production build splits JavaScript into vendor chunks for optimal caching:

```
vendor-react     — react, react-dom, react-router-dom
vendor-mui       — @mui/material, @mui/icons-material, emotion
vendor-dnd       — @dnd-kit/*
vendor-slate     — slate, slate-react
vendor-animation — framer-motion
```

## Troubleshooting

### CORS issues in development

The Vite dev server proxies `/api` to the backend. If you see CORS errors, ensure `VITE_API_TARGET` is set correctly in `.env` or that the backend is running on port 8000.

### Database issues

Delete `backend/data/cards.db` to reset the database. The backend will recreate it on next startup.

### Email issues in development

Set `DEV_MAIL_ENABLED=true` in `.env` to view emails at `/mail` instead of sending via SMTP.

### Docker/Podman networking

In containerized dev, the frontend talks to the backend via the service name `backend:8000`. The `VITE_API_TARGET` is set automatically in `podman-compose.dev.yml`.
