CREATE TABLE IF NOT EXISTS daily_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  task_ids JSONB NOT NULL DEFAULT '[]',
  plan_order JSONB NOT NULL DEFAULT '[]',
  goal TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, plan_date)
);
ALTER TABLE daily_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own plans" ON daily_plans FOR ALL USING (auth.uid() = user_id);
