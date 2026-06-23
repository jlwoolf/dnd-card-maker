# Getting Started

This guide walks you through setting up DnD Card Maker from scratch to your first card.

## Prerequisites

Choose a deployment method:

### With Containers (recommended)

- [Podman](https://podman.io/) and `podman-compose` (or Docker + Docker Compose)

### Bare Metal

- [Node.js](https://nodejs.org/) 22 or later
- [uv](https://docs.astral.sh/uv/) (Python package manager)
- Python 3.12 or later

## Quick Start (Podman)

```bash
# 1. Clone the repo
git clone https://github.com/jlwoolf/dnd-card-maker.git
cd dnd-card-maker

# 2. Create and configure environment
cp .env.example .env
# Generate a JWT secret
openssl rand -hex 32
# Edit .env — paste the value as JWT_SECRET

# 3. Start the application
podman compose up
```

- **Frontend**: [http://localhost:8001/dnd-card-maker](http://localhost:8001/dnd-card-maker)
- **Backend**: [http://localhost:8000](http://localhost:8000) (API docs at `/docs`)

## Quick Start (Bare Metal)

```bash
# 1. Clone and configure
git clone https://github.com/jlwoolf/dnd-card-maker.git
cd dnd-card-maker
cp .env.example .env
# Edit .env — set JWT_SECRET at minimum

# 2. Start backend (terminal 1)
cd backend
uv sync --all-extras
JWT_SECRET=your-secret uv run uvicorn app.main:app --reload --port 8000

# 3. Start frontend (terminal 2)
cd frontend
npm install
npm run dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173) (Vite HMR)
- **Backend**: [http://localhost:8000](http://localhost:8000)

Vite automatically proxies `/api` requests to the backend.

## Development Mode

For development with hot reload on both sides:

```bash
cp .env.example .env
# Set JWT_SECRET and optionally DEV_MAIL_ENABLED=true
podman compose -f podman-compose.dev.yml up
```

- Frontend with Vite HMR at `http://localhost:5173`
- Backend with Uvicorn `--reload` at `http://localhost:8000`
- Source directories are bind-mounted for live editing

## First Run

### 1. Email Setup (required for account creation)

By default the app sends verification emails via SMTP. For development, enable the built-in dev mail viewer:

```env
DEV_MAIL_ENABLED=true
```

With this enabled, you can view verification emails at `/mail` (frontend) without an SMTP server. Visit the page after registering to find your verification link.

For production, configure SMTP in `.env`:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
SMTP_FROM=dnd-cards@example.com
FRONTEND_URL=http://localhost:8001/dnd-card-maker
```

### 2. Optional: Cloudflare Turnstile (CAPTCHA)

To prevent bot registrations, set up Cloudflare Turnstile:

1. Go to [Cloudflare Dashboard > Turnstile](https://dash.cloudflare.com/)
2. Create a site for your domain
3. Add to `.env`:

```env
TURNSTILE_SECRET_KEY=your-secret-key
VITE_TURNSTILE_SITE_KEY=your-site-key
```

Leave both empty to disable CAPTCHA.

### 3. Create Your Account

1. Open the frontend URL in your browser
2. Click **Sign Up** in the navigation bar
3. Enter your email and password
4. Check your email (or `/mail` if dev mail is enabled) for the verification link
5. Click the link to verify your account
6. Log in

### 4. Create Your First Card

1. After logging in, you'll see the card editor
2. Use the toolbar below the card to **Insert Text** or **Insert Image**
3. Customize colors with the **Color Settings** button
4. Click the **+** button on the preview card to add it to your local deck
5. Click **Save to Cloud** to sync it to your account

Your card is now saved and accessible from **My Cards** in the navigation bar.

## Next Steps

- [Features Guide](features.md) — explore all capabilities
- [Configuration Reference](configuration.md) — every environment variable explained
- [Deployment Guide](deployment.md) — production setup with Nginx
- [API Reference](api-reference.md) — all endpoints documented
