# DnD Card Maker — Backend

FastAPI backend providing authentication, card storage, and sharing for the DnD Card Maker app. Uses SQLite via SQLAlchemy and JWT-based auth.

## Tech Stack

- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **Database**: SQLite via [SQLAlchemy](https://www.sqlalchemy.org/) 2.0
- **Auth**: JWT access/refresh tokens via [python-jose](https://github.com/mpdavis/python-jose), bcrypt password hashing
- **Email**: SMTP (verification, password reset)
- **Package manager**: [uv](https://docs.astral.sh/uv/)
- **Tests**: [pytest](https://docs.pytest.org/) with FastAPI TestClient

## Getting Started (local development)

### Prerequisites

- Python 3.12+
- [uv](https://docs.astral.sh/uv/getting-started/installation/)

### Setup

```bash
cd backend

# Install dependencies
uv sync --all-extras

# Copy and configure the environment (at the project root)
cp ../.env.example ../.env
python3 -c "import secrets; print(secrets.token_hex(32))"
# Edit ../.env — set JWT_SECRET and other values
```

### Run the server

```bash
JWT_SECRET=your-secret-here uv run uvicorn app.main:app --reload --port 8000
```

Interactive API docs at `http://localhost:8000/docs`.

### Run tests

```bash
JWT_SECRET=test-secret uv run pytest -v
```

Tests use a temporary SQLite database and do not require SMTP configuration.

## API Endpoints

### Auth (public)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/register` | Create account (sends verification email) |
| `GET`  | `/api/auth/verify/{token}` | Verify email address |
| `POST` | `/api/auth/login` | Login, returns JWT access + refresh tokens |
| `POST` | `/api/auth/refresh` | Exchange refresh token for new access token |
| `POST` | `/api/auth/forgot-password` | Request password reset email |
| `POST` | `/api/auth/reset-password/{token}` | Reset password with token |

### Cards (authenticated — `Authorization: Bearer <token>`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/cards` | List user's cards (summary) |
| `POST` | `/api/cards` | Create a new card |
| `GET` | `/api/cards/{id}` | Get full card |
| `PUT` | `/api/cards/{id}` | Update card |
| `DELETE` | `/api/cards/{id}` | Delete card |
| `POST` | `/api/cards/{id}/share` | Create/update share link `{"mode":"view_only"\|"view_and_copy"}` |
| `DELETE` | `/api/cards/{id}/share` | Remove share link |

### Shared cards (public)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/shared/{slug}` | View a shared card |

## Running with Podman / Docker

### Build

```bash
podman build -t dnd-card-backend -f Containerfile .
```

### Run tests in container

```bash
podman build --target test -t dnd-card-backend-test -f Containerfile .
```

### Run the server

```bash
podman run -d --name dnd-card-backend \
  -p 8000:8000 \
  --env-file ../.env \
  dnd-card-backend
```

## Environment Variables

All configuration lives in the project root `.env` file. See `../.env.example` for the full template.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | Yes | — | Secret key for signing JWT tokens |
| `JWT_ACCESS_EXPIRE_MINUTES` | No | `15` | Access token lifetime |
| `JWT_REFRESH_EXPIRE_DAYS` | No | `7` | Refresh token lifetime |
| `SQLITE_PATH` | No | `./data/cards.db` | Database file path |
| `SMTP_HOST` | No | `localhost` | SMTP server host |
| `SMTP_PORT` | No | `587` | SMTP server port |
| `SMTP_USER` | No | — | SMTP username |
| `SMTP_PASSWORD` | No | — | SMTP password |
| `SMTP_FROM` | No | — | Sender email address |
| `FRONTEND_URL` | No | `http://localhost:5173` | Base URL for email links |
| `DEV_MAIL_ENABLED` | No | `false` | Enable dev mail/admin routes |
| `TURNSTILE_SECRET_KEY` | No | — | Cloudflare Turnstile secret key |

## Project Structure

```
backend/
├── app/
│   ├── main.py            # FastAPI app, CORS, lifespan
│   ├── config.py          # Pydantic Settings (env vars)
│   ├── database.py        # SQLAlchemy engine + session
│   ├── dependencies.py    # get_current_user dependency
│   ├── models/
│   │   ├── user.py        # User ORM model
│   │   └── card.py        # Card ORM model
│   ├── schemas/           # Pydantic request/response models
│   ├── routes/
│   │   ├── auth.py        # /api/auth/*
│   │   ├── cards.py       # /api/cards/*
│   │   └── share.py       # /api/shared/*
│   └── services/
│       ├── auth.py        # Password hashing, JWT helpers
│       └── email.py       # SMTP email sender
├── tests/
│   ├── conftest.py        # Test fixtures
│   └── test_api.py        # API tests
├── pyproject.toml         # Project config + dependencies
├── uv.lock                # Locked dependencies
├── Containerfile          # Multi-stage container build
```
