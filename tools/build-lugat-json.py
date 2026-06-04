#!/usr/bin/env python3
"""Export lugat.db to a JSON file consumable by the meaningMode transformer."""

import json
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "apps" / "readest-app" / "data" / "lugat.db"
OUT_PATH = Path(__file__).resolve().parent.parent / "apps" / "readest-app" / "public" / "data" / "lugat-terms.json"

def main():
    if not DB_PATH.exists():
        print(f"Error: {DB_PATH} not found")
        return

    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    cursor.execute("SELECT term, definition FROM lugat ORDER BY term")
    rows = cursor.fetchall()
    # Compact format: short keys ('t'/'d' instead of 'term'/'definition')
    # saves ~30% file size (4.6 MB → ~3.2 MB for 39K entries)
    entries = [{"t": term, "d": definition} for term, definition in rows]
    conn.close()

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, separators=(',', ':'))

    file_size = OUT_PATH.stat().st_size
    print(f"Exported {len(entries)} terms to {OUT_PATH} ({file_size:,} bytes)")

if __name__ == "__main__":
    main()
