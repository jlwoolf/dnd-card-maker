# DnD Card Maker

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com/)

A self-hosted web application for creating custom tabletop RPG cards — design, preview, organize, and share cards with a rich drag-and-drop editor, cloud sync, and PDF export.

## Features

- **Interactive card editor** with real-time preview — add text and image elements, reorder by dragging, customize with 6-color themes
- **Rich text editing** powered by [Slate.js](https://www.slatejs.org/) — bold, italic, adjustable font size, line height, and alignment
- **Two text variants** — banner (solid bar) and box (bordered rectangle) backgrounds
- **Image elements** — paste URLs or upload local files, with adjustable radius and width
- **Color themes** — full card palette control with auto-extraction from card images
- **Deck management** — animated card stack, import/export JSON, sortable grid view with drag-and-drop
- **Export** — download individual cards as PNG, or select cards to export as multi-page PDF (2.5x3.5" cards)
- **Cloud sync** — save cards to your account, organize into named decks, batch upload for large collections
- **Sharing** — share cards and decks publicly with view-only or view-and-copy permissions
- **JWT authentication** — email/password, email verification, password reset, account deletion
- **Responsive design** — CSS zoom scaling adapts to any viewport size

## Quick Start

```bash
git clone https://github.com/jlwoolf/dnd-card-maker.git
cd dnd-card-maker
cp .env.example .env
# Edit .env: set JWT_SECRET (generate with: openssl rand -hex 32)
podman compose up
```

- **Frontend**: http://localhost:8001/dnd-card-maker
- **Backend**: http://localhost:8000 (API docs at `/docs`)

See the [Getting Started guide](docs/getting-started.md) for bare-metal setup and development mode.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite, MUI 7, Zustand, Slate.js, Framer Motion, dnd-kit |
| **Backend** | FastAPI (Python 3.12+), SQLAlchemy 2, SQLite, JWT (python-jose), bcrypt |
| **Validation** | Zod (frontend), Pydantic (backend) |
| **Testing** | Vitest, Playwright, Storybook (frontend) / pytest (backend) |
| **Container runtime** | Podman + Podman Compose (Docker compatible) |
| **Production serve** | Nginx (Alpine) reverse proxy with SPA fallback |

## Documentation

| Document | Description |
|----------|-------------|
| [Getting Started](docs/getting-started.md) | Setup guide, prerequisites, first card walkthrough |
| [Features](docs/features.md) | Complete feature inventory |
| [Configuration](docs/configuration.md) | All environment variables and options |
| [Architecture](docs/architecture.md) | System design, database schema, data flow |
| [API Reference](docs/api-reference.md) | All 25+ REST endpoints with request/response shapes |
| [Development](docs/development.md) | Local dev setup, testing, linting, project structure |
| [Deployment](docs/deployment.md) | Production deployment, reverse proxy, backups, security |

## Project Structure

```
dnd-card-maker/
├── .env.example                  # Environment variable template
├── podman-compose.yml             # Production containers
├── podman-compose.dev.yml         # Dev containers (hot reload)
├── frontend/                      # React SPA (TypeScript)
│   ├── Containerfile              # Multi-stage: build → Nginx
│   ├── vite.config.ts
│   └── src/
│       ├── components/            # Card editor, deck, cloud views
│       │   ├── Card/              # Core editor + element system
│       │   ├── Deck/              # Animated deck stack
│       │   ├── DeckView/          # Sortable grid (dnd-kit)
│       │   └── Cloud/             # Cloud sync UI
│       ├── pages/                 # Route components + auth pages
│       ├── stores/                # Zustand state management
│       ├── services/              # API client, image processing
│       ├── hooks/                 # Custom hooks
│       └── schemas/               # Zod validation schemas
├── backend/                       # FastAPI REST API (Python)
│   ├── Containerfile              # Multi-stage: deps → test → prod
│   └── app/
│       ├── models/                # SQLAlchemy ORM models
│       ├── schemas/               # Pydantic request/response types
│       ├── routes/                # API endpoint modules
│       └── services/              # Business logic layer
└── docs/                          # Documentation
```

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on setting up a dev environment, running tests, and submitting pull requests.

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Run tests and linters (see [Development](docs/development.md))
4. Commit using [conventional commits](https://www.conventionalcommits.org/)
5. Open a pull request

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.
