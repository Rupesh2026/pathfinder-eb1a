-- Free pre-auth EB-1A Profile Evaluator — conversion funnel storage
-- No RLS: all reads/writes go through service role key in the API route
CREATE TABLE evaluator_assessments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL,
  name            TEXT,
  field           TEXT,
  intake_data     JSONB NOT NULL DEFAULT '{}',
  evaluation      JSONB NOT NULL DEFAULT '{}',
  readiness_score INTEGER CHECK (readiness_score >= 0 AND readiness_score <= 100),
  converted_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_evaluator_assessments_email   ON evaluator_assessments (email);
CREATE INDEX idx_evaluator_assessments_created ON evaluator_assessments (created_at DESC);
