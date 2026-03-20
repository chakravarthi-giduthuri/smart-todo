-- Expo push token (single-row table for single-user app)
-- The backend uses this to survive server restarts on Railway.com
CREATE TABLE IF NOT EXISTS expo_push_tokens (
  id INTEGER PRIMARY KEY DEFAULT 1,
  token TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only the service role (backend) can access this — no user RLS needed
ALTER TABLE expo_push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only_expo_tokens"
  ON expo_push_tokens
  USING (false);  -- blocks all access via anon/user JWTs; backend uses service role key

-- Web push subscription (single-row for browser push)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INTEGER PRIMARY KEY DEFAULT 1,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only_push_subs"
  ON push_subscriptions
  USING (false);
