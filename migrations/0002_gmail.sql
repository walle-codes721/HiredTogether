CREATE TABLE oauth_states (
  state TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE gmail_connections (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  email TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  access_token TEXT,
  access_token_expires_at TEXT,
  connected_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_synced_at TEXT
);

CREATE TABLE processed_gmail_messages (
  message_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  processed_at TEXT NOT NULL DEFAULT (datetime('now'))
);
