-- Run this in Supabase SQL Editor to create the RAG passages table
-- https://supabase.com/dashboard/project/kdivpadatbovgqwoxzqr/sql/new

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

CREATE TABLE IF NOT EXISTS public.risale_passages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chunk_id text NOT NULL,
  book_name text NOT NULL,
  content text NOT NULL,
  embedding vector(1536),
  keywords text[] NULL,
  tags text[] NULL,
  citation text NULL,
  official_alignment_status boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT risale_passages_pkey PRIMARY KEY (id),
  CONSTRAINT risale_passages_chunk_id_key UNIQUE (chunk_id)
);

CREATE INDEX IF NOT EXISTS risale_passages_chunk_id_idx ON public.risale_passages (chunk_id);
CREATE INDEX IF NOT EXISTS risale_passages_book_name_idx ON public.risale_passages (book_name);

ALTER TABLE public.risale_passages ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS risale_passages_select ON public.risale_passages FOR SELECT USING (true);
