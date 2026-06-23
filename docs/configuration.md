# Configuration

All configuration is managed through environment variables in the `.env` file at the project root. Copy `.env.example` to `.env` and customize the values.

## Generating .env

```bash
cp .env.example .env
# Generate a secure JWT secret
openssl rand -hex 32
```

## Backend Variables

| Variable                    | Required | Default                 | Description                                                                                                      |
| --------------------------- | -------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `JWT_SECRET`                | **Yes**  | —                       | Secret key for signing JWT access and refresh tokens. Generate with `openssl rand -hex 32`.                      |
| `JWT_ACCESS_EXPIRE_MINUTES` | No       | `15`                    | Lifetime of access tokens in minutes. Lower is more secure but requires more frequent refreshes.                 |
| `JWT_REFRESH_EXPIRE_DAYS`   | No       | `7`                     | Lifetime of refresh tokens in days. Users must log in again after this period.                                   |
| `SQLITE_PATH`               | No       | `./data/cards.db`       | Path to the SQLite database file. Relative to the backend working directory.                                     |
| `SMTP_HOST`                 | No       | `localhost`             | SMTP server hostname for sending verification and password reset emails.                                         |
| `SMTP_PORT`                 | No       | `587`                   | SMTP server port.                                                                                                |
| `SMTP_USER`                 | No       | —                       | SMTP authentication username.                                                                                    |
| `SMTP_PASSWORD`             | No       | —                       | SMTP authentication password.                                                                                    |
| `SMTP_FROM`                 | No       | —                       | Sender email address for outgoing emails.                                                                        |
| `FRONTEND_URL`              | No       | `http://localhost:5173` | Base URL used to construct verification and password reset links in emails. Set to your production frontend URL. |
| `DEV_MAIL_ENABLED`          | No       | `false`                 | When `true`, enables the `/mail` (email viewer) and `/admin` (DB browser) routes. **Disable in production.**     |
| `TURNSTILE_SECRET_KEY`      | No       | —                       | Cloudflare Turnstile secret key for CAPTCHA verification on registration. Leave empty to disable.                |
| `LOG_LEVEL`                 | No       | `warn`                  | Log level for the backend. One of: `debug`, `info`, `warn`, `error`, `critical`.                                 |

## Frontend Variables

| Variable                  | Required | Default                 | Description                                                                                                                   |
| ------------------------- | -------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `VITE_TURNSTILE_SITE_KEY` | No       | —                       | Cloudflare Turnstile site key. Must match the secret key domain. Leave empty to use a test key (dev only) or disable CAPTCHA. |
| `VITE_BASE_PATH`          | No       | `/dnd-card-maker/`      | Base path for production deployment. Sets the URL prefix for all assets and routes. Use `/` for root deployments.             |
| `VITE_API_TARGET`         | No       | `http://localhost:8000` | Backend API target for the Vite dev server proxy. Only used in development.                                                   |

## SMTP Configuration

The app uses SMTP to send account verification and password reset emails. Configure these variables with your email provider's settings:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=dnd-cards@example.com
```

### Common Providers

**Gmail** (requires app password):

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASSWORD=your-16-char-app-password
```

**SendGrid / Mailgun / Resend** — use the SMTP credentials from your provider dashboard.

### Skipping Email (Development)

For local development, set `DEV_MAIL_ENABLED=true`. This stores outgoing emails in the database and makes them viewable at `/mail` on the frontend — no SMTP server needed.

## Cloudflare Turnstile

Turnstile provides a CAPTCHA challenge on the registration form to prevent automated signups.

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Turnstile**
3. Click **Add site**
4. Enter your domain(s):
   - Development: `localhost`
   - Production: your actual domain
5. Choose widget type: **Managed** (recommended)
6. Copy the **Site Key** and **Secret Key**

Add them to `.env`:

```env
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
VITE_TURNSTILE_SITE_KEY=1x00000000000000000000BB
```

Leave both keys empty to disable CAPTCHA entirely (not recommended for public-facing instances).

## Base Path

The `VITE_BASE_PATH` variable controls the URL path prefix for the frontend. This is essential when deploying behind a reverse proxy on a sub-path.

| Deployment                               | VITE_BASE_PATH     |
| ---------------------------------------- | ------------------ |
| Root domain (`example.com/`)             | `/`                |
| Sub-path (`example.com/dnd-card-maker/`) | `/dnd-card-maker/` |

The Nginx configuration, Vite build, and React Router basename all respect this setting automatically.

## Rate Limiting

The backend enforces rate limits (configured in `backend/app/constants.py`):

| Scope                          | Limit                  |
| ------------------------------ | ---------------------- |
| Global                         | 60 requests per minute |
| Auth endpoints (`/api/auth/*`) | 5 requests per minute  |
| Registration                   | 3 requests per minute  |

Rate limiting uses [slowapi](https://github.com/laurentS/slowapi) and is backed by in-memory storage.

## CORS Proxy

The backend includes a built-in CORS proxy at `/api/proxy/image` that fetches remote images to avoid canvas tainting during HTML-to-image capture. The proxy:

- Accepts a `?url=` query parameter
- Has a 10 MB response size limit
- Blocks requests to loopback addresses (127.0.0.1, localhost, etc.) for security
- Returns the image with appropriate CORS headers

No additional configuration is needed — the frontend automatically uses this proxy for cross-origin images.
