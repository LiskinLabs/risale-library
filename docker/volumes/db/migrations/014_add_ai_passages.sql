-- Migration: 014_add_ai_passages.sql
-- Add pgvector extension and passages table for RAG

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

CREATE TABLE IF NOT EXISTS public.risale_passages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chunk_id text NOT NULL,
  book_name text NOT NULL,
  content text NOT NULL,
  embedding vector(1536), -- Assuming OpenAI or similar embeddings
  keywords text[] NULL,
  tags text[] NULL,
  citation text NULL,
  official_alignment_status boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT risale_passages_pkey PRIMARY KEY (id),
  CONSTRAINT risale_passages_chunk_id_key UNIQUE (chunk_id)
);

CREATE INDEX IF NOT EXISTS risale_passages_embedding_idx ON public.risale_passages USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

ALTER TABLE public.risale_passages ENABLE ROW LEVEL SECURITY;
CREATE POLICY risale_passages_select ON public.risale_passages FOR SELECT USING (true);
