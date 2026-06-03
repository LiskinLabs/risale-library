import os
import json
import time
import requests
from supabase import create_client, Client

# --- Configuration ---
WORKING_KEY = "AIzaSyCpLbw4Z82-VPsXE2j3JHqrEWnfKw5CMWU"
SUPABASE_URL = "https://kdivpadatbovgqwoxzqr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkaXZwYWRhdGJvdmdxd294enFyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDMwNTM3NywiZXhwIjoyMDk1ODgxMzc3fQ.EAgpCXFhgzB98HWRuRlfRpIM4erejanOUEyXoVyRD3Y"

URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={WORKING_KEY}"

def get_embedding(text):
    while True:
        try:
            payload = {"content": {"parts": [{"text": text[:5000]}]}}
            response = requests.post(URL, json=payload)
            if response.status_code == 200:
                return response.json().get("embedding", {}).get("values")
            elif response.status_code == 429:
                print("Rate limit (429) hit. Waiting 10 seconds...")
                time.sleep(10)
                continue # Retry
            else:
                print(f"Gemini Error {response.status_code}")
                return None
        except Exception as e:
            print(f"Error: {e}")
            return None

def main():
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Process in batches
    res = supabase.table("risale_passages").select("chunk_id, content").is_("embedding", "null").limit(200).execute()
    chunks = res.data
    
    if not chunks:
        print("No more chunks to embed!")
        return

    print(f"Processing {len(chunks)} chunks...")
    
    success = 0
    for chunk in chunks:
        vector = get_embedding(chunk["content"])
        if vector:
            try:
                supabase.table("risale_passages").update({"embedding": vector}).eq("chunk_id", chunk["chunk_id"]).execute()
                success += 1
                if success % 5 == 0:
                    print(f"Processed {success}/{len(chunks)}")
            except Exception as e:
                print(f"DB Error: {e}")
        time.sleep(1.0) # Base delay

    print(f"Done! Successfully embedded {success} chunks.")

if __name__ == "__main__":
    main()
