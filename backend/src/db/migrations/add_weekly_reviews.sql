CREATE TABLE IF NOT EXISTS weekly_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  score INTEGER,
  summary TEXT,
  wins JSONB,
  improvement_areas JSONB,
  next_week_suggestions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own reviews" ON weekly_reviews FOR ALL USING (auth.uid() = user_id);
