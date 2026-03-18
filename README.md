# Webhook Listener v2

A self-hosted webhook listener with a web UI, persistent PostgreSQL storage, and cookie-based authentication. Create endpoints, receive webhooks from any service, and inspect the captured requests (headers, body, query params, cookies) through a dark-themed dashboard.

## Features

- **Webhook capture** - Accepts GET, POST, PUT, PATCH, DELETE on generated endpoint URLs and stores the full request
- **Web UI** - Dark-themed dashboard to create endpoints, browse captured requests, and manage your account
- **Cookie-based auth** - No username or password required. Click "Login with Cookie" to get started. A recovery token lets you reclaim your data if the cookie expires
- **PostgreSQL storage** - All data persisted in Postgres with `tbl_wl_` prefixed tables
- **Configurable limits** - Max endpoints per user and max stored requests per endpoint
- **Admin API** - Optional admin endpoint to query all data across users

## Quick Start

### Prerequisites

- Node.js 22+
- PostgreSQL 15+

### Setup

```bash
# Install dependencies
npm install

# Copy and edit the environment file
cp .env.example .env
# Edit .env with your database credentials and desired settings

# Run database migrations
npm run migrate

# Start the server
npm start

# Or start in watch mode for development
npm run dev
```

The app will be available at `http://localhost:<WL_PORT>`.

### Docker

```bash
# Build the image
docker build -t webhook-listener .

# Or use docker compose (expects an external network called internal_proxy)
docker compose up -d
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `WL_PORT` | Port the server listens on | `3000` |
| `WL_MAX_ITEMS_PER_ENDPOINT` | Max stored requests per endpoint (oldest are pruned) | `50` |
| `WL_MAX_ENDPOINTS_PER_USER` | Max endpoints a single user can create | `20` |
| `WL_COOKIE_NAME` | Name of the session cookie | `wl_session` |
| `WL_COOKIE_MAX_AGE_DAYS` | Session cookie lifetime in days | `30` |
| `WL_COOKIE_SECRET` | Secret used to sign cookies (change this!) | - |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | PostgreSQL database name | `postgres` |
| `DB_USER` | PostgreSQL user | `postgres` |
| `DB_PASS` | PostgreSQL password | - |
| `POSTGRES_USER` | Used by the Postgres Docker container on first start (set same as `DB_USER`) | - |
| `POSTGRES_PASSWORD` | Used by the Postgres Docker container on first start (set same as `DB_PASS`) | - |
| `WL_ADMIN_KEY` | Secret key for the admin API (see below) | empty (disabled) |

## Admin API

The admin endpoint `GET /api/admin/data` returns all endpoints across all users along with their webhook counts and owner display names. It is protected by the `WL_ADMIN_KEY` environment variable.

**How it works:**

- If `WL_ADMIN_KEY` is empty or not set, the endpoint is **disabled** and returns `403 Unauthorized` for all requests.
- If `WL_ADMIN_KEY` is set to a value, requests must include an `admin-key` header matching that exact value.

```bash
# Example usage
curl -H "admin-key: your-secret-key" http://localhost:3088/api/admin/data
```

This is useful for monitoring or building external dashboards that need visibility into all webhook activity on the instance.

## Sending Webhooks

Once you create an endpoint in the dashboard, you get a unique URL:

```
http://your-host:3088/webhooks/a1b2c3d4e5f6g7h8
```

Point any service (GitHub, Stripe, etc.) at that URL. The listener accepts any HTTP method and stores the full request for you to inspect.

## Database Schema

All tables are prefixed with `tbl_wl_`:

| Table | Purpose |
|---|---|
| `tbl_wl_users` | User accounts with recovery tokens |
| `tbl_wl_sessions` | Active session cookies (auto-cleaned hourly) |
| `tbl_wl_endpoints` | Webhook endpoints owned by users |
| `tbl_wl_webhooks` | Captured webhook requests (headers, body, query params, cookies) |

## Running Tests

Tests use the Node.js built-in test runner and require a running PostgreSQL instance.

```bash
npm test
```

## Project Structure

```
src/
  config/       - Environment config
  db/           - Database pool, schema, migrations
  middleware/   - Auth and header middleware
  models/       - Data access layer (users, sessions, endpoints, webhooks)
  routes/       - Express routers (pages, API, webhook receiver)
  views/        - Handlebars templates (layouts, partials, pages)
  public/       - Static assets (CSS, JS)
  app.js        - Express app setup
  server.js     - Entry point
test/           - Test suite
```

## Tech Stack

- **Runtime** - Node.js 
- **Framework** - Express
- **Templates** - Handlebars (express-handlebars)
- **Database** - PostgreSQL (pg)
- **Auth** - Cookie-based sessions with recovery tokens
- **Tests** - Node.js built-in test runner + supertest
