#!/usr/bin/env python3
"""Create risale_passages table in Supabase via the SQL API, then run the import."""

import sys
import os
import httpx
from pathlib import Path

# Load env from project .env.local
ENV_FILE = Path(__file__).parent.parent / "apps" / "readest-app" / ".env.local"
if ENV_FILE.exists():
    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            if k not in os.environ:
                os.environ[k] = v.strip().strip('"').strip("'")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL") or ""
SUPABASE_KEY = os.getenv("SUPABASE_ADMIN_KEY") or ""

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ADMIN_KEY in .env.local", file=sys.stderr)
    sys.exit(1)

SQL = """
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
""".strip()

def main():
    # Try to run SQL via the REST API (may not work for DDL)
    # Use the Supabase Management API as fallback
    import httpx

    # Method 1: Try the Supabase SQL API
    resp = httpx.post(
        f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
        },
        json={"sql": SQL},
    )

    if resp.status_code in (200, 201):
        print("✅ Table created via RPC")
        return 0

    print(f"RPC failed ({resp.status_code}): {resp.text[:200]}")
    print()
    print("Please run this SQL in the Supabase SQL Editor:")
    print("https://supabase.com/dashboard/project/kdivpadatbovgqwoxzqr/sql/new")
    print()
    print("=" * 60)
    print(SQL)
    print("=" * 60)
    return 1

if __name__ == "__main__":
    sys.exit(main())
