CREATE TYPE letter_status AS ENUM (
  'not_asked',
  'asked',
  'agreed',
  'draft_sent',
  'received'
);

CREATE TABLE IF NOT EXISTS recommendation_letters (
  id                     uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recommender_name       text        NOT NULL,
  recommender_title      text,
  recommender_institution text,
  relationship           text,
  criteria               criterion_type[],
  status                 letter_status DEFAULT 'not_asked' NOT NULL,
  notes                  text,
  target_date            date,
  requested_at           timestamptz,
  received_at            timestamptz,
  created_at             timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE recommendation_letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own letters"
  ON recommendation_letters FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
