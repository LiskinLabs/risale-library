import sqlite3
import os
import re
from pathlib import Path

SOURCE_DIR = Path("C:/Users/silvestr.liskin/Desktop/risale_extraction/lugat/tr")
DB_PATH = Path("C:/Users/silvestr.liskin/Desktop/risale-ai-studio/apps/readest-app/data/lugat.db")

def setup_db(conn):
    cursor = conn.cursor()
    cursor.execute("DROP TABLE IF EXISTS lugat")
    cursor.execute("""
        CREATE TABLE lugat (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            term TEXT NOT NULL,
            arabic TEXT,
            definition TEXT NOT NULL
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_term ON lugat(term)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_arabic ON lugat(arabic)")

def parse_line(line):
    line = line.strip()
    if not line or '=' not in line:
        return None
    
    try:
        term, definition = line.split('=', 1)
        term = term.strip()
        definition = definition.strip()
        
        # Extract Arabic if present: (اعداء) Düşmanlar.
        arabic = None
        # Match something like (اعداء) or (اعداد) at the beginning of definition
        m = re.match(r'^\(([\u0600-\u06FF\s]+)\)\s*(.*)', definition)
        if m:
            arabic = m.group(1).strip()
            definition = m.group(2).strip()
            
        if not term or not definition:
            return None
            
        return term, arabic, definition
    except Exception as e:
        print(f"Error parsing line: {line} - {e}")
        return None

def run_import():
    print(f"Source: {SOURCE_DIR}")
    print(f"Target: {DB_PATH}")
    
    if not SOURCE_DIR.exists():
        print(f"Error: Source directory {SOURCE_DIR} does not exist.")
        return

    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    setup_db(conn)
    
    cursor = conn.cursor()
    count = 0
    
    # Sort files to ensure consistent import order
    files = sorted(list(SOURCE_DIR.glob("*.txt")))
    
    for file_path in files:
        if file_path.name.endswith("_f.txt"):
            continue
            
        print(f"Processing {file_path.name}...")
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                for line in f:
                    parsed = parse_line(line)
                    if parsed:
                        cursor.execute(
                            "INSERT INTO lugat (term, arabic, definition) VALUES (?, ?, ?)",
                            parsed
                        )
                        count += 1
        except Exception as e:
            print(f"Error reading file {file_path.name}: {e}")
    
    # Set user_version to match the migration count (1) so migrations
    # are skipped at runtime — avoids FTS5 requirement in WASM builds.
    cursor.execute("PRAGMA user_version = 1")
    conn.commit()
    conn.close()
    print(f"Successfully imported {count} entries.")

if __name__ == "__main__":
    run_import()
