CREATE TYPE criterion_type AS ENUM (
  'awards',
  'memberships',
  'press',
  'judging',
  'original_contributions',
  'scholarly_articles',
  'artistic_exhibitions',
  'critical_role',
  'high_salary',
  'commercial_success'
);

CREATE TYPE strength_tier_type AS ENUM (
  'strong',
  'medium',
  'weak'
);

CREATE TYPE opportunity_type AS ENUM (
  'cfp',
  'judging',
  'speaking',
  'award',
  'podcast',
  'grant',
  'peer_review'
);

CREATE TYPE outcome_status_type AS ENUM (
  'pending',
  'accepted',
  'rejected',
  'withdrawn'
);

CREATE TYPE salary_band_type AS ENUM (
  'under_150k',
  '150k_200k',
  '200k_300k',
  '300k_plus'
);
