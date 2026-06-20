# Webhook Listener v2

A self-hosted webhook listener with a dark-themed web UI, cookie-based authentication, and PostgreSQL storage. Create endpoints, send webhooks to them from any service, and inspect the captured requests in real time.

## Features

- **Cookie-based auth** — no passwords. Click "Login with Cookie" to get started. A recovery token lets you reclaim your data if the cookie expires.
- **Persistent storage** — all data lives in SQLite (tables prefixed `tbl_wl_`).
- **Web UI** — dark theme, collapsible sidebar, desktop-first layout.
- **Multi-endpoint** — create up to 20 endpoints per user (configurable).
- **Request capture** — captures headers, cookies, query params, and body for GET, POST, PUT, PATCH, and DELETE.
- **History management** — auto-trims to the last N requests per endpoint. Manual "Keep Last 10" button available.
- **Admin API** — optional admin endpoint for retrieving all data across users.
- **Docker-ready** — ships with a Dockerfile and docker-compose.yaml.

## Quick Start

### Prerequisites

- Node.js 24+ (utilizes built-in native SQLite)

### 1. Clone and install

```bash
git clone https://github.com/necrolingus/nodejs_webhook_listener_v2.git
cd nodejs_webhook_listener_v2
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values (see [Environment Variables](#environment-variables) below).

### 3. Run database migration

The migration runs automatically on startup, but you can also run it manually:

```bash
npm run migrate
```

### 4. Start the server

```bash
# Production
npm start

# Development (auto-reload on file changes)
npm run dev
```

Open `http://localhost:<WL_PORT>` in your browser.

## Docker

### docker-compose (recommended)

```bash
docker-compose up -d
```

This starts the webhook listener container and maps a persistent volume for the SQLite database. Make sure your `.env` file is configured.

### Dockerfile only

```bash
docker build -t webhook-listener .
docker run --env-file .env -p 3088:3088 webhook-listener
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `WL_PORT` | Port the server listens on | `3000` |
| `WL_MAX_ITEMS_PER_ENDPOINT` | Max stored requests per endpoint (oldest auto-trimmed) | `50` |
| `WL_MAX_ENDPOINTS_PER_USER` | Max endpoints a user can create | `20` |
| `WL_COOKIE_NAME` | Name of the session cookie | `wl_session` |
| `WL_COOKIE_MAX_AGE_DAYS` | Session cookie lifetime in days | `30` |
| `WL_COOKIE_SECRET` | Secret used to sign cookies — **change this** | — |
| `DB_FILE` | SQLite database file path | `data/webhook_listener.db` |
| `WL_ADMIN_KEY` | API key for the admin endpoint (see below) | *(empty — admin endpoint disabled)* |

## Admin API (`WL_ADMIN_KEY`)

The admin endpoint provides a read-only view of all endpoints across all users, including webhook counts and owner display names. This is useful for monitoring, external dashboards, or automation that needs visibility into all webhook activity.

```
GET /api/admin/data
```

**Header required:**

```
admin-key: <your WL_ADMIN_KEY value>
```

- If `WL_ADMIN_KEY` is **empty or not set**, the admin endpoint is **disabled** and rejects all requests.
- Set it to a strong random string in your `.env` to enable it.

Example:

```bash
curl -H "admin-key: my-secret-key" http://localhost:3088/api/admin/data
```

## Sending Webhooks

Once you create an endpoint in the UI, you get a unique endpoint key. Send requests to:

```
POST   /webhooks/<endpoint_key>
GET    /webhooks/<endpoint_key>
PUT    /webhooks/<endpoint_key>
PATCH  /webhooks/<endpoint_key>
DELETE /webhooks/<endpoint_key>
```

The listener captures the HTTP method, headers, cookies, query parameters, and request body, then stores them in the database.

Example:

```bash
curl -X POST http://localhost:3088/webhooks/abc123 \
  -H "Content-Type: application/json" \
  -d '{"event": "order.created", "id": 42}'
```

## Authentication Flow

1. **First visit** — click "Login with Cookie" to create an account. A session cookie is set and a recovery token is displayed.
2. **Save your recovery token** — this is the only way to recover your data if the cookie expires or you switch browsers.
3. **Cookie expires** — after 30 days (configurable), go to the login page and enter your recovery token under "Recover Account". A new session is created and linked to all your existing data.
4. **Settings** — view your recovery token and set a display name from the Settings page.

## API Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/endpoints` | Cookie | Create a new endpoint |
| `GET` | `/api/endpoints` | Cookie | List your endpoints |
| `DELETE` | `/api/endpoints/:key` | Cookie | Delete an endpoint |
| `GET` | `/api/endpoints/:key/webhooks` | Cookie | List webhooks (paginated) |
| `DELETE` | `/api/endpoints/:key/webhooks/:id` | Cookie | Delete a single webhook |
| `POST` | `/api/endpoints/:key/webhooks/keep-last` | Cookie | Keep only the last N webhooks |
| `GET` | `/api/admin/data` | Admin key | Get all endpoints and users |

## Database Schema

All tables are prefixed with `tbl_wl_`:

- **tbl_wl_users** — user accounts with recovery tokens
- **tbl_wl_sessions** — active sessions tied to users
- **tbl_wl_endpoints** — webhook endpoints owned by users
- **tbl_wl_webhooks** — captured webhook requests (headers, cookies, query params, body stored as text and automatically parsed into JSON on query retrieval)

The schema auto-migrates on startup using `src/db/schema.sql`.

## Running Tests

```bash
npm test
```

Tests use the Node.js built-in test runner with `supertest`. They run against an isolated SQLite test database file (`data/webhook_listener_test_*.db`) that is automatically created and cleaned up during the test run.

## Project Structure

```
src/
  config/       Configuration (reads from .env)
  db/           Database pool, schema, migration
  middleware/   Auth and header middleware
  models/       Data access layer (users, sessions, endpoints, webhooks)
  routes/       Express routers (pages, API, webhook receiver)
  views/        Handlebars templates (layouts, partials, pages)
  public/       Static assets (CSS, JS)
  app.js        Express app setup
  server.js     Entry point
test/           Test suite
```

## License

ISC
