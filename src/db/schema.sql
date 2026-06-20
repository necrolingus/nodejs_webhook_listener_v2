CREATE TABLE IF NOT EXISTS tbl_wl_users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    recovery_token VARCHAR(64) NOT NULL UNIQUE,
    display_name  VARCHAR(100),
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wl_users_recovery_token ON tbl_wl_users(recovery_token);

CREATE TABLE IF NOT EXISTS tbl_wl_sessions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL REFERENCES tbl_wl_users(id) ON DELETE CASCADE,
    session_token VARCHAR(128) NOT NULL UNIQUE,
    expires_at    DATETIME NOT NULL,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wl_sessions_token ON tbl_wl_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_wl_sessions_user_id ON tbl_wl_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_wl_sessions_expires ON tbl_wl_sessions(expires_at);

CREATE TABLE IF NOT EXISTS tbl_wl_endpoints (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL REFERENCES tbl_wl_users(id) ON DELETE CASCADE,
    endpoint_key  VARCHAR(16) NOT NULL UNIQUE,
    label         VARCHAR(100),
    response_code SMALLINT NOT NULL DEFAULT 200,
    response_body TEXT,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_wl_endpoints_key ON tbl_wl_endpoints(endpoint_key);
CREATE INDEX IF NOT EXISTS idx_wl_endpoints_user_id ON tbl_wl_endpoints(user_id);

CREATE TABLE IF NOT EXISTS tbl_wl_webhooks (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint_id   INTEGER NOT NULL REFERENCES tbl_wl_endpoints(id) ON DELETE CASCADE,
    http_method   VARCHAR(10) NOT NULL,
    source_host   VARCHAR(255),
    headers       TEXT,
    cookies       TEXT,
    query_params  TEXT,
    body          TEXT,
    received_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wl_webhooks_endpoint_id ON tbl_wl_webhooks(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_wl_webhooks_received_at ON tbl_wl_webhooks(received_at DESC);
