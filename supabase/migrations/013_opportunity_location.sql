-- Worldwide opportunity discovery: track where an opportunity is and how it's delivered.
--   country       : display name of the host country (e.g. "United States", "United
--                   Kingdom", "Global"). NULL when unknown.
--   is_us         : normalized flag — true when the opportunity is hosted in the US.
--   delivery_mode : how a participant attends — 'online', 'in_person', or 'hybrid'.
--                   (Named delivery_mode, not "mode", because bare `mode` collides with
--                    Postgres's built-in mode() ordered-set aggregate in PostgREST.)
--
-- Visibility rule enforced at read time (API + opportunities page):
--   US opportunities  -> shown regardless of mode (online AND in-person/offline)
--   non-US             -> shown only when delivery_mode is online or hybrid (never pure
--                         in-person)

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS country       TEXT,
  ADD COLUMN IF NOT EXISTS is_us         BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivery_mode TEXT NOT NULL DEFAULT 'online';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'opportunities_delivery_mode_check'
  ) THEN
    ALTER TABLE opportunities
      ADD CONSTRAINT opportunities_delivery_mode_check
      CHECK (delivery_mode IN ('online', 'in_person', 'hybrid'));
  END IF;
END $$;

-- Speeds up the read-time visibility filter (is_us OR delivery_mode <> 'in_person').
CREATE INDEX IF NOT EXISTS idx_opportunities_visibility
  ON opportunities (is_us, delivery_mode);
