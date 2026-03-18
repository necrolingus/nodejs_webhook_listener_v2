CREATE TABLE IF NOT EXISTS tbl_wl_users (
    id            SERIAL PRIMARY KEY,
    recovery_token VARCHAR(64) NOT NULL UNIQUE,
    display_name  VARCHAR(100),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wl_users_recovery_token ON tbl_wl_users(recovery_token);

CREATE TABLE IF NOT EXISTS tbl_wl_sessions (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER NOT NULL REFERENCES tbl_wl_users(id) ON DELETE CASCADE,
    session_token VARCHAR(128) NOT NULL UNIQUE,
    expires_at    TIMESTAMPTZ NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wl_sessions_token ON tbl_wl_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_wl_sessions_user_id ON tbl_wl_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_wl_sessions_expires ON tbl_wl_sessions(expires_at);

CREATE TABLE IF NOT EXISTS tbl_wl_endpoints (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER NOT NULL REFERENCES tbl_wl_users(id) ON DELETE CASCADE,
    endpoint_key  VARCHAR(16) NOT NULL UNIQUE,
    label         VARCHAR(100),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active     BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_wl_endpoints_key ON tbl_wl_endpoints(endpoint_key);
CREATE INDEX IF NOT EXISTS idx_wl_endpoints_user_id ON tbl_wl_endpoints(user_id);

CREATE TABLE IF NOT EXISTS tbl_wl_webhooks (
    id            SERIAL PRIMARY KEY,
    endpoint_id   INTEGER NOT NULL REFERENCES tbl_wl_endpoints(id) ON DELETE CASCADE,
    http_method   VARCHAR(10) NOT NULL,
    source_host   VARCHAR(255),
    headers       JSONB,
    cookies       JSONB,
    query_params  JSONB,
    body          JSONB,
    received_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wl_webhooks_endpoint_id ON tbl_wl_webhooks(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_wl_webhooks_received_at ON tbl_wl_webhooks(received_at DESC);
