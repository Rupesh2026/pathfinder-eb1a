-- Add focused_criteria and education to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS focused_criteria criterion_type[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS education        JSONB            DEFAULT '[]'::jsonb;

-- NULL focused_criteria = no focus set (show all 10 criteria)
-- Empty array {} is treated the same as NULL on the frontend
