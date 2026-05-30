ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS target_filing_date date DEFAULT NULL;
