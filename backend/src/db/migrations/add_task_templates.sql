CREATE TABLE IF NOT EXISTS task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 3,
  scheduled_time TIME,
  duration_minutes INTEGER,
  context_tags JSONB DEFAULT '[]',
  recurrence TEXT NOT NULL DEFAULT 'daily',
  note TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_spawned_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own templates" ON task_templates FOR ALL USING (auth.uid() = user_id);
