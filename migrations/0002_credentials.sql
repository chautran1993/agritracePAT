CREATE TABLE IF NOT EXISTS user_credentials (
 username TEXT PRIMARY KEY,
 password_hash TEXT NOT NULL,
 password_salt TEXT NOT NULL,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
