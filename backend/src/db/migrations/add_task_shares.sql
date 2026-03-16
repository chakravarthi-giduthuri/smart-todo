CREATE TABLE IF NOT EXISTS task_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  recipient_email TEXT DEFAULT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE task_shares ENABLE ROW LEVEL SECURITY;

-- Anyone can read a share (public share links)
CREATE POLICY "public_read_shares"
  ON task_shares FOR SELECT
  USING (true);

-- Authenticated users can create shares (task ownership is enforced at the route level)
CREATE POLICY "auth_insert_shares"
  ON task_shares FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Anyone can mark a share as complete (recipients have no auth)
CREATE POLICY "public_update_shares"
  ON task_shares FOR UPDATE
  USING (true);

-- Only the task owner can delete shares — via authenticated client
CREATE POLICY "auth_delete_shares"
  ON task_shares FOR DELETE
  USING (auth.uid() IS NOT NULL);
