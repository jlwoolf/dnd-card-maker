# Deployment

This guide covers deploying DnD Card Maker in production using Podman Compose.

## Architecture

The production setup runs two containers behind Nginx:

```
Internet → Nginx (:8001) → Frontend static files (React SPA)
                          → /api/* → Backend (:8000, internal)
```

The backend is not exposed directly to the internet. All traffic routes through the Nginx reverse proxy in the frontend container.

## Quick Deploy

```bash
# 1. Clone and configure
git clone https://github.com/jlwoolf/dnd-card-maker.git
cd dnd-card-maker
cp .env.example .env

# 2. Generate secrets
openssl rand -hex 32  # → JWT_SECRET

# 3. Edit .env with production values
# Required: JWT_SECRET, SMTP_*, FRONTEND_URL
# Optional: TURNSTILE_SECRET_KEY, VITE_TURNSTILE_SITE_KEY

# 4. Start
podman compose up -d
```

The app will be available at `http://localhost:8001/dnd-card-maker`.

## Environment Variables for Production

At minimum, configure these in `.env`:

```env
# Security
JWT_SECRET=<output from openssl rand -hex 32>

# Email (required for account verification)
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=dnd-cards@example.com

# URLs
FRONTEND_URL=https://your-domain.com/dnd-card-maker

# Base path — set to / for root domain deployment
VITE_BASE_PATH=/dnd-card-maker/

# Optional: CAPTCHA
TURNSTILE_SECRET_KEY=your-secret-key
VITE_TURNSTILE_SITE_KEY=your-site-key

# Production security
DEV_MAIL_ENABLED=false
```

## Reverse Proxy (External Nginx / Caddy / Traefik)

If you run your own reverse proxy in front of the app, point it at the frontend container:

### Nginx Example

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    location /dnd-card-maker {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Caddy Example

```
your-domain.com {
    handle_path /dnd-card-maker/* {
        reverse_proxy localhost:8001
    }
}
```

### Base Path Configuration

The `VITE_BASE_PATH` variable must match the path used in your reverse proxy:

| Proxy Path        | VITE_BASE_PATH     |
| ----------------- | ------------------ |
| `/` (root domain) | `/`                |
| `/dnd-card-maker` | `/dnd-card-maker/` |
| `/cards`          | `/cards/`          |

This variable is passed as a build argument to the frontend container. Rebuild when changing it:

```bash
podman compose build --no-cache frontend
podman compose up -d
```

## Data Persistence

The SQLite database is stored in a named volume `db_data` mounted at `/app/data` in the backend container:

```yaml
volumes:
  db_data: # Declared at compose level
```

### Backing Up

```bash
# The volume is stored in Podman's volume directory.
# To copy the database file out:
podman cp dnd-card-backend:/app/data/cards.db ./backup-cards.db
```

### Restoring

```bash
podman cp ./backup-cards.db dnd-card-backend:/app/data/cards.db
podman compose restart backend
```

## Health Checks

The backend container has a health check that queries `/api/health`:

```yaml
healthcheck:
  test:
    [
      "CMD",
      "python",
      "-c",
      "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')",
    ]
  interval: 10s
  timeout: 5s
  retries: 3
  start_period: 15s
```

The frontend waits for the backend to be healthy before starting.

## Security Considerations

### JWT Secret

Use a strong, unique secret (at least 32 bytes). Generate with:

```bash
openssl rand -hex 32
```

### Token Lifetime

Default access token lifetime is 15 minutes. Consider reducing for high-security deployments:

```env
JWT_ACCESS_EXPIRE_MINUTES=5
```

### CAPTCHA

Enable Cloudflare Turnstile for public-facing instances to prevent automated registrations. See [Configuration](configuration.md#cloudflare-turnstile).

### CORS Proxy

The built-in image proxy at `/api/proxy/image` blocks loopback addresses (127.0.0.0/8, ::1, localhost) to prevent server-side request forgery. Do not expose the backend port directly to the internet.

### Rate Limiting

Default rate limits provide basic protection against brute-force attacks on auth endpoints. Adjust in `backend/app/constants.py` if needed for your deployment scale.

### HTTPS

Always run behind a reverse proxy that terminates TLS. The app itself does not handle HTTPS.

## Upgrading

```bash
# Pull latest changes
git pull

# Rebuild images
podman compose build --no-cache

# Restart with new images
podman compose up -d

# Verify health
podman compose ps
```

Database migrations are handled automatically at startup via the `init_db()` function in the FastAPI lifespan handler. New columns are added to existing tables as needed.

## Monitoring

The backend exposes:

- `GET /api/health` — returns `{"status": "ok"}` when running
- `GET /docs` — OpenAPI documentation (consider disabling in production by setting `docs_url=None` in `main.py`)

## Troubleshooting

### Containers won't start

```bash
# Check logs
podman compose logs

# Check individual container
podman logs dnd-card-backend
podman logs dnd-card-maker
```

### Database locked

SQLite can have concurrency issues under high load. The app uses `check_same_thread=False` in its SQLAlchemy configuration to handle this. If you encounter lock errors, ensure only one backend instance is running.

### Build fails

```bash
# Clear Podman build cache
podman system prune -a

# Rebuild from scratch
podman compose build --no-cache
```

### Port conflicts

If ports 8000 or 8001 are in use, modify the port mappings in `podman-compose.yml`:

```yaml
ports:
  - "9001:80" # Frontend on different port
```

Update `FRONTEND_URL` accordingly.
