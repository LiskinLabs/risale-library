import os
import json
import argparse
from supabase import create_client, Client

def main():
    parser = argparse.ArgumentParser(description="Import RAG passages into Supabase")
    parser.add_argument("--source", required=True, help="Path to all-passages.jsonl or directory")
    parser.add_argument("--url", default=os.getenv("SUPABASE_URL"), help="Supabase URL")
    parser.add_argument("--key", default=os.getenv("SUPABASE_SERVICE_KEY"), help="Supabase Service Role Key")
    args = parser.parse_args()

    if not args.url or not args.key:
        print("Error: Supabase URL and Service Key are required. Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars.")
        return

    supabase: Client = create_client(args.url, args.key)
    
    file_path = args.source
    if os.path.isdir(args.source):
        file_path = os.path.join(args.source, "all-passages.jsonl")

    if not os.path.exists(file_path):
        print(f"Error: File not found: {file_path}")
        return

    print(f"Importing passages from {file_path}")
    count = 0
    batch_size = 100
    batch = []

    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            try:
                data = json.loads(line)
                record = {
                    "chunk_id": data.get("chunk_id"),
                    "book_name": data.get("book_name", "Unknown"),
                    "content": data.get("text", data.get("content", "")),
                    "embedding": data.get("embedding_text"),
                    "keywords": data.get("keywords", []),
                    "tags": data.get("tags", []),
                    "citation": data.get("citation", ""),
                    "official_alignment_status": data.get("official_alignment_status", True),
                }
                batch.append(record)
                
                if len(batch) >= batch_size:
                    supabase.table("risale_passages").upsert(batch, on_conflict="chunk_id").execute()
                    count += len(batch)
                    print(f"Inserted {count} passages...")
                    batch = []
            except Exception as e:
                print(f"Error processing line: {e}")
                
    if batch:
        supabase.table("risale_passages").upsert(batch, on_conflict="chunk_id").execute()
        count += len(batch)

    print(f"Import complete! Total passages inserted: {count}")

if __name__ == "__main__":
    main()
