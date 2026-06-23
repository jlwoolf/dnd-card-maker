# DnD Card Maker

A self-hosted web app for creating custom tabletop RPG cards. Design, preview, organize, and share cards with a rich drag-and-drop editor, cloud sync, and PDF export.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, MUI 7, Zustand 5, Slate, Framer Motion, dnd-kit |
| Backend | FastAPI (Python 3.12+), SQLAlchemy 2, SQLite, JWT auth, bcrypt |
| Containerization | Podman + Podman Compose |
| Production serve | Nginx (Alpine) for static assets |

## Prerequisites

- [Podman](https://podman.io/) + `podman-compose`
- Or: [Node.js](https://nodejs.org/) 22+ and [uv](https://docs.astral.sh/uv/) for bare-metal dev

## Quick Start

### Production

```bash
cp backend/.env.example backend/.env
# Edit backend/.env — at minimum set JWT_SECRET
podman compose up
```

- **Frontend** → `http://localhost:8001/dnd-card-maker` (Nginx + SPA)
- **Backend** → `http://localhost:8000`

### Development (hot reload)

```bash
cp backend/.env.example backend/.env
# Edit backend/.env — at minimum set JWT_SECRET
podman compose -f podman-compose.dev.yml up
```

- **Frontend** → `http://localhost:5173` (Vite HMR on `.tsx`/`.css` changes)
- **Backend** → `http://localhost:8000` (Uvicorn `--reload` on `.py` changes)
- API proxy → Vite forwards `/api` to the backend container

## Bare-Metal Dev

```bash
# Terminal 1 — Backend
cp backend/.env.example backend/.env
cd backend && uv sync --all-extras
uv run uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend && npm install && npm run dev
```

Vite proxies `/api` to `http://localhost:8000` (override with `VITE_API_TARGET`).

## Configuration

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | Yes | — | Secret key for signing JWT tokens (generate with `openssl rand -hex 32`) |
| `JWT_ACCESS_EXPIRE_MINUTES` | No | `15` | Access token lifetime |
| `JWT_REFRESH_EXPIRE_DAYS` | No | `7` | Refresh token lifetime |
| `SQLITE_PATH` | No | `./data/cards.db` | Database file path |
| `SMTP_HOST` | No | `localhost` | SMTP server host |
| `SMTP_PORT` | No | `587` | SMTP server port |
| `SMTP_USER` | No | — | SMTP username |
| `SMTP_PASSWORD` | No | — | SMTP password |
| `SMTP_FROM` | No | — | Sender email address |
| `FRONTEND_URL` | No | `http://localhost:5173` | Base URL for verification/reset links in emails |
| `DEV_MAIL_ENABLED` | No | `false` | Enable `/mail` and `/admin` dev-only routes |
| `TURNSTILE_SECRET_KEY` | No | — | Cloudflare Turnstile secret key (leave empty to disable CAPTCHA) |

### Frontend (`frontend/.env` — optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_TURNSTILE_SITE_KEY` | test key | Cloudflare Turnstile site key for registration CAPTCHA |
| `VITE_API_TARGET` | `http://localhost:8000` | API proxy target for Vite dev server |
| `VITE_BASE_PATH` | `/dnd-card-maker/` | Base path for production deployment |
| `VITE_CORS_PROXY` | — | CORS proxy URL for cross-origin image capture |

Copy `frontend/.env.example` to `frontend/.env` and fill in as needed (only required if using CAPTCHA or customizing the proxy).

### Cloudflare Turnstile (CAPTCHA)

1. Go to [Cloudflare Dashboard → Turnstile](https://dash.cloudflare.com/)
2. Create a site with domain `localhost` (for dev) and your production domain
3. Copy the site key and secret key
4. Set in backend `.env`: `TURNSTILE_SECRET_KEY=<secret>`
5. Set in frontend (dev only): `export VITE_TURNSTILE_SITE_KEY=<site-key>` before `podman compose up`

Leave both keys empty to disable CAPTCHA (not recommended for production).

## Project Structure

```
dnd-card-maker/
├── frontend/
│   ├── Containerfile              # Production build (Nginx + SPA)
│   ├── Containerfile.dev          # Dev image (Vite HMR)
│   ├── nginx.conf                 # SPA fallback, gzip, cache headers
│   ├── vite.config.ts             # Build config, proxy, manualChunks
│   ├── package.json
│   ├── .env.example               # Frontend env template
│   └── src/
│       ├── App.tsx                # Router + routes
│       ├── main.tsx               # React entry
│       ├── components/            # Shared UI components
│       │   ├── Card/              # Card editor, preview, elements
│       │   ├── Deck/              # Deck stack widget
│       │   ├── DeckView/          # Sortable card grid (dnd-kit)
│       │   ├── Cloud/             # Cloud sync views
│       │   ├── ExportModal/       # PDF export + card selection
│       │   └── NavBar.tsx         # Top navigation
│       ├── pages/                 # Route-level page components
│       ├── stores/                # Zustand state management
│       ├── services/              # API client, image processing
│       ├── hooks/                 # Shared hooks
│       ├── schemas/               # Zod schemas + type definitions
│       └── utils/                 # Helpers
├── backend/
│   ├── Containerfile              # Production build (Python + uv)
│   ├── Containerfile.dev          # Dev image (uvicorn --reload)
│   ├── pyproject.toml             # Dependencies + tool config
│   ├── uv.lock                    # Locked dependencies
│   ├── .env.example               # Backend env template
│   └── app/
│       ├── main.py                # FastAPI app, CORS, router registration
│       ├── config.py              # Pydantic Settings
│       ├── database.py            # SQLAlchemy engine + session
│       ├── dependencies.py        # get_current_user dependency
│       ├── constants.py           # App-wide constants
│       ├── models/                # SQLAlchemy ORM models
│       ├── schemas/               # Pydantic request/response schemas
│       ├── routes/                # API endpoint modules
│       ├── services/              # Business logic
│       └── templates/             # Email HTML templates
├── podman-compose.yml             # Production compose
├── podman-compose.dev.yml         # Dev compose (bind mounts, hot reload)
└── .gitignore
```

## Running Tests

```bash
# Backend
cd backend && uv run pytest -v

# Frontend unit tests
cd frontend && npm run test

# Frontend E2E tests
cd frontend && npm run test:e2e
```
