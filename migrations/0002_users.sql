-- Adds local username/password accounts, replacing GitHub OAuth.
-- Apply with: wrangler d1 execute solidarity-leaderboard --file=migrations/0002_users.sql

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  is_admin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users (username);

-- To promote an existing account to admin, after they've registered once:
--   UPDATE users SET is_admin = 1 WHERE username = 'yourname';
