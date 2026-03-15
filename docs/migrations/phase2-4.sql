-- Phase 2-4 Schema Migrations
-- Run these in Supabase SQL Editor before deploying v2.0 Phase 2-4
-- Run phase1.sql first if you haven't already.

-- ── Phase 2 ──────────────────────────────────────────────────────────────────

-- Context tags (auto-detected by Claude)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS context_tags text[] NOT NULL DEFAULT '{}';

-- Task note (AI-generated 1-sentence reminder)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS note text;

-- ── Phase 3 ──────────────────────────────────────────────────────────────────

-- Snooze support for escalating notifications
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS snoozed_until timestamptz;

-- Daily energy check-ins
CREATE TABLE IF NOT EXISTS energy_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  level text NOT NULL CHECK (level IN ('high', 'medium', 'low')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Phase 4 ──────────────────────────────────────────────────────────────────

-- Task dependency chains
CREATE TABLE IF NOT EXISTS task_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(task_id, depends_on_id)
);

CREATE INDEX IF NOT EXISTS task_dependencies_task_idx ON task_dependencies(task_id);

-- Calendar sync (Phase 4 - scaffold for future OAuth)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS calendar_event_id text;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS calendar_provider text;

-- Collaboration — share tokens
CREATE TABLE IF NOT EXISTS task_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  recipient_email text,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS task_shares_token_idx ON task_shares(token);
