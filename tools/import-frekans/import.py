#!/usr/bin/env python3
"""
Import word frequency data from risale_extraction/source_frekans into lugat.db.

Adds a 'level' column to the lugat table and populates it based on
word frequency in the Risale-i Nur corpus:

  Level 0 (Başlangıç) — top 300 most frequent words (must-know)
  Level 1 (Orta)       — frequency rank 301-1000
  Level 2 (İleri)      — frequency rank 1001+ (rare theological terms)
  Level 3 (Tümü)       — unclassified (not in frequency data)

The level is used by Sözlük Seviyesi to filter dictionary lookups.
"""

import csv
import sqlite3
import sys
from pathlib import Path
from collections import Counter

FREKANS_DIR = Path("C:/Users/silvestr.liskin/Desktop/risale_extraction/source_frekans")
DATA_DIR = FREKANS_DIR / "data/SorularlaRisale/analysis/terkipli"
DB_PATH = Path("C:/Users/silvestr.liskin/Desktop/risale-ai-studio/apps/readest-app/data/lugat.db")

# Level thresholds (by frequency rank)
LEVEL_0_CUTOFF = 300   # top 300 → Başlangıç
LEVEL_1_CUTOFF = 1000  # 301-1000 → Orta

def load_frequencies():
    """Load all frequency files, return word→rank mapping (1=most frequent)."""
    word_freq = Counter()
    for f in DATA_DIR.glob("*_frekans.txt"):
        with open(f, 'r', encoding='utf-8') as fh:
            reader = csv.DictReader(fh)
            for row in reader:
                word = row.get('kelime', '').strip().lower()
                freq = int(row.get('frekans', 0))
                if word and freq > 0:
                    word_freq[word] += freq

    print(f"Loaded {len(word_freq)} unique words from frequency files")

    # Sort by frequency descending, assign rank 1 to most frequent
    ranked = sorted(word_freq.items(), key=lambda x: -x[1])
    word_rank = {}
    for rank, (word, freq) in enumerate(ranked, 1):
        word_rank[word] = rank
        if rank <= 10:
            print(f"  #{rank}: {word} (freq={freq})")

    return word_rank

def get_level(rank):
    if rank <= LEVEL_0_CUTOFF:
        return 0  # Başlangıç
    elif rank <= LEVEL_1_CUTOFF:
        return 1  # Orta
    else:
        return 2  # İleri

def main():
    print("=" * 60)
    print("Importing frequency data → lugat.db dictionary levels")
    print("=" * 60)

    word_rank = load_frequencies()

    # Connect to DB
    db = sqlite3.connect(str(DB_PATH))

    # Add level column if not exists
    try:
        db.execute("ALTER TABLE lugat ADD COLUMN level INTEGER DEFAULT 3")
        print("Added 'level' column to lugat table")
    except sqlite3.OperationalError:
        print("'level' column already exists")

    # Match dictionary terms against frequency data
    updated = 0
    rows = db.execute("SELECT id, term FROM lugat").fetchall()
    for row_id, term in rows:
        term_lower = term.lower().strip() if term else ''
        # Try exact match and variations
        rank = word_rank.get(term_lower)
        if not rank:
            # Try without suffixes (basic stemming)
            for suffix in ['ler', 'lar', 'i', 'ı', 'u', 'ü', 'e', 'a', 'de', 'da', 'dir', 'dır']:
                if term_lower.endswith(suffix) and len(term_lower) > len(suffix) + 2:
                    stem = term_lower[:-len(suffix)]
                    rank = word_rank.get(stem)
                    if rank:
                        break

        if rank:
            level = get_level(rank)
            db.execute("UPDATE lugat SET level = ? WHERE id = ?", (level, row_id))
            updated += 1

    db.commit()

    # Stats
    stats = db.execute("""
        SELECT level, COUNT(*) FROM lugat GROUP BY level ORDER BY level
    """).fetchall()

    print(f"\nMatched {updated}/{len(rows)} dictionary entries")
    print("\nLevel distribution:")
    for level, count in stats:
        labels = {0: 'Başlangıç (A1-A2)', 1: 'Orta (B1-B2)', 2: 'İleri (C1-C2)', 3: 'Tümü'}
        print(f"  Level {level} — {labels.get(level, '?')}: {count:,} terms")

    db.close()
    print("\n✅ Done! Sözlük Seviyesi is now functional.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
