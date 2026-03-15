-- Auth Migration — run in Supabase SQL Editor
-- Adds user_id to all tables + Row Level Security
-- Run AFTER enabling Supabase Auth in your project dashboard.

-- ── 1. Add user_id columns ─────────────────────────────────────────────────

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE subtasks ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE override_log ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE energy_checkins ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE task_dependencies ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE task_shares ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- ── 2. Enable Row Level Security ────────────────────────────────────────────

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE override_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_shares ENABLE ROW LEVEL SECURITY;

-- ── 3. RLS Policies ─────────────────────────────────────────────────────────

-- Tasks: users see only their own
DROP POLICY IF EXISTS "users_own_tasks" ON tasks;
CREATE POLICY "users_own_tasks" ON tasks USING (auth.uid() = user_id);

-- Subtasks: users see only their own
DROP POLICY IF EXISTS "users_own_subtasks" ON subtasks;
CREATE POLICY "users_own_subtasks" ON subtasks USING (auth.uid() = user_id);

-- Override log: users see only their own
DROP POLICY IF EXISTS "users_own_overrides" ON override_log;
CREATE POLICY "users_own_overrides" ON override_log USING (auth.uid() = user_id);

-- Energy check-ins: users see only their own
DROP POLICY IF EXISTS "users_own_energy" ON energy_checkins;
CREATE POLICY "users_own_energy" ON energy_checkins USING (auth.uid() = user_id);

-- Task dependencies: users see only their own
DROP POLICY IF EXISTS "users_own_dependencies" ON task_dependencies;
CREATE POLICY "users_own_dependencies" ON task_dependencies USING (auth.uid() = user_id);

-- Task shares: owner can manage; public can read/complete by token (no auth needed)
DROP POLICY IF EXISTS "owner_manages_shares" ON task_shares;
CREATE POLICY "owner_manages_shares" ON task_shares
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "public_read_share_by_token" ON task_shares;
CREATE POLICY "public_read_share_by_token" ON task_shares
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_complete_share" ON task_shares;
CREATE POLICY "public_complete_share" ON task_shares
  FOR UPDATE USING (true);

-- ── 4. Migrate existing rows (claim orphan data) ────────────────────────────
-- Run this ONCE after signing in to your account to claim existing tasks.
-- Replace 'YOUR-USER-UUID' with your actual user UUID from Supabase Auth → Users.

-- UPDATE tasks SET user_id = 'YOUR-USER-UUID' WHERE user_id IS NULL;
-- UPDATE override_log SET user_id = 'YOUR-USER-UUID' WHERE user_id IS NULL;
-- UPDATE subtasks SET user_id = 'YOUR-USER-UUID' WHERE user_id IS NULL;
-- UPDATE energy_checkins SET user_id = 'YOUR-USER-UUID' WHERE user_id IS NULL;
-- UPDATE task_dependencies SET user_id = 'YOUR-USER-UUID' WHERE user_id IS NULL;
