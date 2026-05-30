ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reflections ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- evidence
CREATE POLICY "Users can view own evidence"
  ON evidence FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own evidence"
  ON evidence FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own evidence"
  ON evidence FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own evidence"
  ON evidence FOR DELETE USING (auth.uid() = user_id);

-- opportunities: read + update from frontend; INSERT is service-role only (agents)
CREATE POLICY "Users can view own opportunities"
  ON opportunities FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own opportunities"
  ON opportunities FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- outcomes
CREATE POLICY "Users can view own outcomes"
  ON outcomes FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own outcomes"
  ON outcomes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own outcomes"
  ON outcomes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- daily_plans: read-only from frontend; INSERT/UPDATE is service-role only (agents)
CREATE POLICY "Users can view own daily plans"
  ON daily_plans FOR SELECT USING (auth.uid() = user_id);

-- weekly_reflections: read-only from frontend; INSERT/UPDATE is service-role only (agents)
CREATE POLICY "Users can view own weekly reflections"
  ON weekly_reflections FOR SELECT USING (auth.uid() = user_id);
