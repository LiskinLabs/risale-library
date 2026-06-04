#!/usr/bin/env python3
"""
Import word frequency data from risale_extraction/source_frekans into lugat.db.

Assigns 'level' (0-3) to dictionary terms based on word frequency rank:
  Level 0 (Başlangıç) — top 300 most frequent words
  Level 1 (Orta)       — frequency rank 301-1000
  Level 2 (İleri)      — frequency rank 1001+
  Level 3 (Tümü)       — unmatched (no frequency data found)

Uses Turkish morphological normalization (70+ suffixes) and
apostrophe-aware matching to maximize coverage.

Usage:
  PYTHONUTF8=1 python tools/import-frekans/import.py
"""

import csv
import sqlite3
import sys
from collections import Counter
from pathlib import Path

FREKANS_DIR = Path("C:/Users/silvestr.liskin/Desktop/risale_extraction/source_frekans")
DATA_DIR = FREKANS_DIR / "data/SorularlaRisale/analysis/terkipli"
DB_PATH = Path("C:/Users/silvestr.liskin/Desktop/risale-ai-studio/apps/readest-app/data/lugat.db")

# Level thresholds (by frequency rank)
LEVEL_0_CUTOFF = 300   # top 300 → Başlangıç
LEVEL_1_CUTOFF = 1000  # 301-1000 → Orta

# ── Turkish normalization (mirrors risaleLugatProvider.ts) ────────────

TR_SUFFIXES = [
    # Possessive + case combos (longest first)
    'larındaki', 'lerindeki', 'larından', 'lerinden',
    'larında', 'lerinde', 'larına', 'lerine',
    'larıyla', 'leriyle',
    # Plural + possessive
    'larımız', 'lerimiz', 'larınız', 'leriniz',
    'larının', 'lerinin', 'larıma', 'lerime',
    # Plural
    'lardan', 'lerden', 'larda', 'lerde',
    'ları', 'leri', 'lar', 'ler',
    # Verbal nouns (mastar)
    'maktan', 'mekten', 'makta', 'mekte',
    'masına', 'mesine', 'masını', 'mesini',
    'ması', 'mesi',
    # Participles / gerunds
    'dıktan', 'dikten', 'duktan', 'dükten',
    'dığında', 'diğinde', 'duğunda', 'düğünde',
    'dığını', 'diğini', 'duğunu', 'düğünü',
    'dığı', 'diği', 'duğu', 'düğü',
    # Possessive
    'ımız', 'imiz', 'umuz', 'ümüz',
    'ınız', 'iniz', 'unuz', 'ünüz',
    'ının', 'inin', 'unun', 'ünün',
    'ına', 'ine', 'una', 'üne',
    'ım', 'im', 'um', 'üm',
    'ın', 'in', 'un', 'ün',
    'ı', 'i', 'u', 'ü',
    'sı', 'si', 'su', 'sü',
    # Case suffixes
    'ndan', 'nden', 'nda', 'nde',
    'dan', 'den', 'tan', 'ten',
    'da', 'de', 'ta', 'te',
    # Dative
    'ya', 'ye',
    # Ablative/instrumental
    'yla', 'yle', 'la', 'le',
    # Other
    'ken', 'ki', 'ce', 'ca', 'çe', 'ça',
    'dir', 'dır', 'dur', 'dür', 'tir', 'tır',
    # Compound markers
    'lık', 'lik', 'luk', 'lük',
    'sız', 'siz', 'suz', 'süz',
    'cık', 'cik', 'cuk', 'cük',
]

# Consonant mutations: voiced → unvoiced at stem boundary
MUTATIONS = {'ğ': 'k', 'b': 'p', 'c': 'ç', 'd': 't'}


def normalize(word: str) -> list[str]:
    """Generate candidate root forms for a Turkish word."""
    candidates = [word]
    lower = word.lower()

    # Apostrophe: remove suffix after apostrophe → "Allah'ın" → "Allah"
    apostrophe_idx = lower.find("'")
    if apostrophe_idx > 0:
        after = lower[:apostrophe_idx]
        if len(after) >= 3:
            candidates.append(after)

    # Try stripping each known suffix
    for suffix in TR_SUFFIXES:
        if lower.endswith(suffix) and len(lower) - len(suffix) >= 3:
            stem = lower[:-len(suffix)]

            # Consonant mutation reversal
            last = stem[-1] if stem else ''
            if last in MUTATIONS:
                candidates.append(stem[:-1] + MUTATIONS[last])

            if len(stem) >= 3:
                candidates.append(stem)

    # Deduplicate preserving order
    seen = set()
    result = []
    for c in candidates:
        if c not in seen:
            seen.add(c)
            result.append(c)
    return result


def load_frequencies():
    """Load all frequency files, return word→rank mapping (1=most frequent)."""
    word_freq = Counter()
    files_loaded = 0
    for f in sorted(DATA_DIR.glob("*_frekans.txt")):
        try:
            with open(f, 'r', encoding='utf-8') as fh:
                reader = csv.DictReader(fh)
                for row in reader:
                    word = row.get('kelime', '').strip().lower()
                    freq = int(row.get('frekans', 0))
                    if word and freq > 0:
                        word_freq[word] += freq
            files_loaded += 1
        except Exception as e:
            print(f"  WARNING: Could not read {f.name}: {e}")

    print(f"Loaded {len(word_freq):,} unique words from {files_loaded} frequency files")

    # Sort by frequency descending, assign rank 1 to most frequent
    ranked = sorted(word_freq.items(), key=lambda x: -x[1])
    word_rank = {}
    for rank, (word, freq) in enumerate(ranked, 1):
        word_rank[word] = rank
        if rank <= 15:
            print(f"  #{rank}: {word} (freq={freq:,})")

    return word_rank


def get_level(rank: int) -> int:
    if rank <= LEVEL_0_CUTOFF:
        return 0  # Başlangıç
    elif rank <= LEVEL_1_CUTOFF:
        return 1  # Orta
    else:
        return 2  # İleri


def find_rank(term: str, word_rank: dict[str, int]) -> int | None:
    """
    Try to find a frequency rank for a dictionary term.
    Uses multiple strategies in order:
      1. Exact match
      2. Normalized candidates (suffix stripping)
      3. Without apostrophe
      4. Definition keyword matching (done separately)
    """
    term_lower = term.lower().strip()
    if not term_lower:
        return None

    # Strategy 1: Exact match
    rank = word_rank.get(term_lower)
    if rank:
        return rank

    # Strategy 2: Normalized candidates
    for cand in normalize(term_lower):
        if cand == term_lower:
            continue
        rank = word_rank.get(cand)
        if rank:
            return rank

    # Strategy 3: Without any apostrophe at all
    no_apos = term_lower.replace("'", '')
    if no_apos != term_lower:
        rank = word_rank.get(no_apos)
        if rank:
            return rank
        # Also try normalized without apostrophe
        for cand in normalize(no_apos):
            rank = word_rank.get(cand)
            if rank:
                return rank

    return None


def main():
    print("=" * 60)
    print("Importing frequency data → lugat.db dictionary levels")
    print("=" * 60)
    print()

    word_rank = load_frequencies()
    print()

    # Connect to DB
    db = sqlite3.connect(str(DB_PATH))

    # Add level column if not exists
    try:
        db.execute("ALTER TABLE lugat ADD COLUMN level INTEGER DEFAULT 3")
        print("Added 'level' column to lugat table")
    except sqlite3.OperationalError:
        pass  # Already exists

    # Reset all levels to 3 before re-import
    db.execute("UPDATE lugat SET level = 3")
    print("Reset all levels to 3 (Tümü)")

    # ── Pass 1: Direct matching via normalization ────────────────────
    matched_direct = 0
    rows = db.execute("SELECT id, term, definition FROM lugat").fetchall()
    for row_id, term, definition in rows:
        rank = find_rank(term, word_rank)
        if rank:
            level = get_level(rank)
            db.execute("UPDATE lugat SET level = ? WHERE id = ?", (level, row_id))
            matched_direct += 1

    db.commit()
    print(f"Pass 1 (direct + normalization): {matched_direct:,} matched")

    # ── Pass 2: Multi-word terms → match first word ──────────────────
    matched_multi = 0
    remaining = db.execute(
        "SELECT id, term FROM lugat WHERE level = 3"
    ).fetchall()
    for row_id, term in remaining:
        # Try just the first word of multi-word terms
        first_word = term.strip().split()[0] if term.strip() else ''
        if first_word and first_word != term:
            rank = find_rank(first_word, word_rank)
            if rank:
                level = get_level(rank)
                db.execute("UPDATE lugat SET level = ? WHERE id = ?", (level, row_id))
                matched_multi += 1

    db.commit()
    print(f"Pass 2 (first-word matching): {matched_multi:,} matched")

    # ── Pass 3: Definition keyword lookup ────────────────────────────
    matched_def = 0
    remaining = db.execute(
        "SELECT id, term, definition FROM lugat WHERE level = 3"
    ).fetchall()
    for row_id, term, definition in remaining:
        if not definition:
            continue
        # Extract potential keywords from definition (first 3 words, last resort)
        def_words = definition.lower().replace(',', ' ').replace('.', ' ').split()
        best_rank = None
        for dw in def_words[:5]:  # Check first 5 words of definition
            if len(dw) < 4:
                continue
            rank = word_rank.get(dw)
            if rank and (best_rank is None or rank < best_rank):
                best_rank = rank
        if best_rank:
            level = get_level(best_rank)
            db.execute("UPDATE lugat SET level = ? WHERE id = ?", (level, row_id))
            matched_def += 1

    db.commit()
    print(f"Pass 3 (definition keywords): {matched_def:,} matched")

    # ── Pass 4: Heuristic fallback ───────────────────────────────────
    # Assign level 2 to remaining terms that are single words (likely
    # rare theological terms that simply aren't in the frequency corpus).
    # Multi-word compound terms stay at level 3 (they're lookup phrases).
    matched_heuristic = 0
    remaining = db.execute(
        "SELECT id, term FROM lugat WHERE level = 3"
    ).fetchall()
    for row_id, term in remaining:
        # Single-word terms with Arabic/original script → level 2
        word_count = len(term.strip().split())
        has_arabic = any('؀' <= c <= 'ۿ' for c in term)
        if word_count == 1 or has_arabic:
            db.execute("UPDATE lugat SET level = 2 WHERE id = ?", (row_id,))
            matched_heuristic += 1

    db.commit()
    print(f"Pass 4 (heuristic fallback): {matched_heuristic:,} assigned level 2")

    # ── Final stats ──────────────────────────────────────────────────
    total = len(rows)
    stats = db.execute(
        "SELECT level, COUNT(*) FROM lugat GROUP BY level ORDER BY level"
    ).fetchall()

    print()
    print("=" * 60)
    print("FINAL LEVEL DISTRIBUTION")
    print("=" * 60)
    labels = {0: 'Başlangıç (A1-A2)', 1: 'Orta (B1-B2)', 2: 'İleri (C1-C2)', 3: 'Tümü'}
    for level, count in stats:
        pct = count / total * 100
        bar = '█' * int(pct / 2)
        print(f"  Level {level} — {labels.get(level, '?')}: {count:>6,} ({pct:5.1f}%) {bar}")

    db.close()

    print()
    print(f"✅ Done! Coverage: {(total - (dict(stats).get(3, 0))) / total * 100:.1f}% classified")
    return 0


if __name__ == "__main__":
    sys.exit(main())
