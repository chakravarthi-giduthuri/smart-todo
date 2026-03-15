-- Phase 1 Schema Migrations
-- Run these in Supabase SQL Editor before deploying v2.0 Phase 1

-- 1. Add is_archived column (doom list / auto-archive)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;

-- 2. Add timezone_offset_minutes (already added in v1.0 fix, included for completeness)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS timezone_offset_minutes integer NOT NULL DEFAULT 0;

-- 3. Add recurrence columns
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence text;
-- Values: null | 'daily' | 'weekdays' | 'weekly' | 'monthly'
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_parent_id uuid REFERENCES tasks(id);

-- 4. Create subtasks table
CREATE TABLE IF NOT EXISTS subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  title text NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Index for subtask lookups
CREATE INDEX IF NOT EXISTS subtasks_task_id_idx ON subtasks(task_id);

-- 6. Index for doom list queries (overdue non-archived)
CREATE INDEX IF NOT EXISTS tasks_scheduled_date_idx ON tasks(scheduled_date) WHERE is_archived = false AND is_completed = false;
