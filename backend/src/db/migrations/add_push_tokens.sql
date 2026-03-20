-- Expo push token (single-row table for single-user app)
-- The backend uses this to survive server restarts on Railway.com
CREATE TABLE IF NOT EXISTS expo_push_tokens (
  id INTEGER PRIMARY KEY DEFAULT 1,
  token TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backend uses the anon key (not service role), so RLS must be off for these tables.
-- They contain no user PII — just a single push token row.
ALTER TABLE expo_push_tokens DISABLE ROW LEVEL SECURITY;

-- Web push subscription (single-row for browser push)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INTEGER PRIMARY KEY DEFAULT 1,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE push_subscriptions DISABLE ROW LEVEL SECURITY;
