CREATE INDEX idx_profiles_user_id ON profiles(user_id);

CREATE INDEX idx_evidence_user_id ON evidence(user_id);
CREATE INDEX idx_evidence_user_criterion ON evidence(user_id, criterion);

CREATE INDEX idx_opportunities_user_id ON opportunities(user_id);
CREATE INDEX idx_opportunities_user_dismissed ON opportunities(user_id, dismissed);
CREATE INDEX idx_opportunities_user_criterion ON opportunities(user_id, criterion);

CREATE INDEX idx_outcomes_user_id ON outcomes(user_id);
CREATE INDEX idx_outcomes_opportunity_id ON outcomes(opportunity_id);

CREATE INDEX idx_daily_plans_user_id ON daily_plans(user_id);
CREATE INDEX idx_daily_plans_user_date ON daily_plans(user_id, plan_date);

CREATE INDEX idx_weekly_reflections_user_id ON weekly_reflections(user_id);
CREATE INDEX idx_weekly_reflections_user_week ON weekly_reflections(user_id, week_start);
