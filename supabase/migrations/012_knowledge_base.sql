-- Raw scraped documents (AAO decisions, policy updates, court opinions)
CREATE TABLE IF NOT EXISTS raw_documents (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  source       text NOT NULL,
  source_url   text,
  title        text,
  content      text NOT NULL,
  content_hash text UNIQUE NOT NULL,
  published_at date,
  criteria     criterion_type[],
  created_at   timestamptz DEFAULT now()
);

-- Chunked text with OpenAI embeddings (text-embedding-3-small, 1536 dims)
CREATE TABLE IF NOT EXISTS document_chunks (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id uuid REFERENCES raw_documents(id) ON DELETE CASCADE NOT NULL,
  chunk_index int NOT NULL,
  content     text NOT NULL,
  embedding   vector(1536),
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
  ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Structured patterns extracted per document by PatternExtractor
CREATE TABLE IF NOT EXISTS case_patterns (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id   uuid REFERENCES raw_documents(id) ON DELETE CASCADE NOT NULL,
  criterion     criterion_type NOT NULL,
  outcome       text NOT NULL,
  pattern_text  text NOT NULL,
  evidence_type text,
  weight        float DEFAULT 1.0,
  created_at    timestamptz DEFAULT now()
);

-- Aggregated stats per criterion, refreshed after each scrape run
CREATE TABLE IF NOT EXISTS pattern_aggregates (
  criterion     criterion_type PRIMARY KEY,
  total_docs    int DEFAULT 0,
  approval_rate float,
  top_patterns  jsonb,
  rfe_triggers  jsonb,
  updated_at    timestamptz DEFAULT now()
);

-- Scrape run history
CREATE TABLE IF NOT EXISTS scrape_runs (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  source      text NOT NULL,
  status      text NOT NULL,
  docs_found  int DEFAULT 0,
  docs_added  int DEFAULT 0,
  error       text,
  started_at  timestamptz DEFAULT now(),
  finished_at timestamptz
);

-- Semantic search function used by KnowledgeBaseClient
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(1536),
  match_criterion text DEFAULT NULL,
  match_count     int  DEFAULT 5
)
RETURNS TABLE(id uuid, content text, source text, title text, similarity float)
LANGUAGE sql
AS $$
  SELECT
    dc.id,
    dc.content,
    rd.source,
    rd.title,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  JOIN raw_documents rd ON dc.document_id = rd.id
  WHERE
    match_criterion IS NULL
    OR match_criterion::criterion_type = ANY(rd.criteria)
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
$$;
