ALTER TABLE profiles
  ADD COLUMN strategy_weights JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Backfill existing rows so agents never encounter a bare {} on first run
UPDATE profiles
SET strategy_weights = '{
  "discovery_weights": {
    "judging":  1.0,
    "cfp":      1.0,
    "speaking": 1.0,
    "awards":   1.0,
    "review":   1.0,
    "podcast":  1.0
  },
  "actions_per_day": 3,
  "filing_urgency":  "balanced"
}'::jsonb
WHERE strategy_weights = '{}'::jsonb;
