#!/usr/bin/env python3
"""
Merge auto-extracted vecize with existing hand-curated collection.
Outputs updated quotes.ts TypeScript file.

Usage:
  PYTHONUTF8=1 python tools/merge-vecize.py
"""

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
QUOTES_TS = ROOT / "apps" / "readest-app" / "src" / "services" / "quotes.ts"

# Books to skip (parallel translations, not Turkish originals)
SKIP_BOOKS = {"Küçük Sözler (Ru Parallel)"}

# Max quotes per book in final collection
MAX_PER_BOOK = 10


def run_extraction():
    """Run import-vecize.py and capture JSON output."""
    result = subprocess.run(
        [sys.executable, str(ROOT / "tools" / "import-vecize.py"),
         "--max-per-book", "20", "--min-score", "0.35", "--output", "json"],
        capture_output=True, text=True, cwd=str(ROOT),
        env={**__import__('os').environ, "PYTHONUTF8": "1"},
    )
    # Find JSON in output (before the "Total:" line)
    json_start = result.stdout.find('{')
    json_end = result.stdout.rfind('}')
    if json_start == -1 or json_end == -1:
        print("ERROR: Could not find JSON in extraction output")
        print(result.stdout[:1000])
        print(result.stderr[:1000])
        sys.exit(1)

    json_str = result.stdout[json_start:json_end+1]
    return json.loads(json_str)


def read_existing_quotes():
    """Parse existing VECIZELER array from quotes.ts."""
    content = QUOTES_TS.read_text(encoding='utf-8')

    # Extract the VECIZELER array using simple regex
    match = re.search(r'export const VECIZELER: Vecize\[\] = \[(.*?)\];', content, re.DOTALL)
    if not match:
        print("ERROR: Could not find VECIZELER array in quotes.ts")
        sys.exit(1)

    array_str = match.group(1)
    existing = []
    # Parse each entry
    for entry_match in re.finditer(
        r"\{\s*id:\s*'([^']+)',\s*text:\s*\"([^\"]+)\",\s*book:\s*'([^']+)'(?:,\s*section:\s*'([^']+)')?\s*\}",
        array_str
    ):
        existing.append({
            "id": entry_match.group(1),
            "text": entry_match.group(2),
            "book": entry_match.group(3),
            "section": entry_match.group(4) or "",
        })

    return existing


def text_similarity(a: str, b: str) -> float:
    """Simple word overlap similarity for dedup."""
    words_a = set(a.lower().split())
    words_b = set(b.lower().split())
    if not words_a or not words_b:
        return 0.0
    intersection = words_a & words_b
    return len(intersection) / min(len(words_a), len(words_b))


def merge(existing: list[dict], extracted: dict[str, list[dict]]) -> list[dict]:
    """Merge existing and extracted quotes, deduplicating."""
    merged = list(existing)  # Start with hand-curated
    existing_texts = [q["text"] for q in existing]

    for book, quotes in extracted.items():
        if book in SKIP_BOOKS:
            continue

        # Count existing quotes for this book
        existing_count = sum(1 for q in merged if q["book"] == book)
        remaining = MAX_PER_BOOK - existing_count

        added = 0
        for quote in quotes:
            if added >= remaining:
                break

            # Check for similarity to existing
            too_similar = False
            for et in existing_texts:
                if text_similarity(quote["text"], et) > 0.6:
                    too_similar = True
                    break

            if too_similar:
                continue

            # Assign new ID
            book_prefixes = {
                "Sözler": "s", "Lem'alar": "l", "Mektubat": "m", "Şuâlar": "su",
                "Mesnevî-i Nuriye": "mn", "Asâ-yı Musa": "am", "Barla Lahikası": "bl",
                "Emirdağ Lahikası-1": "ed1", "Emirdağ Lahikası-2": "ed2",
                "Kastamonu Lahikası": "kl", "İşârât-ül İ'caz": "ii",
                "Küçük Kitaplar": "kk", "Muhakemat": "mh",
                "Sikke-i Tasdik-i Gaybî": "st", "Tarihçe-i Hayat": "th",
            }
            prefix = book_prefixes.get(book, book[:3].lower())
            count = sum(1 for q in merged if q["id"].startswith(prefix + "-"))

            merged.append({
                "id": f"{prefix}-{count + 1:02d}",
                "text": quote["text"],
                "book": book,
                "section": quote.get("section", ""),
            })
            existing_texts.append(quote["text"])
            added += 1

    return merged


def write_quotes_ts(quotes: list[dict]):
    """Write the updated quotes.ts file."""
    content = QUOTES_TS.read_text(encoding='utf-8')

    # Build the new array
    entries = []
    for q in quotes:
        text = q["text"].replace('\\', '\\\\').replace('"', '\\"')
        book = q["book"].replace('\\', '\\\\').replace("'", "\\'")
        section = q.get("section", "").replace('\\', '\\\\').replace("'", "\\'")
        if section:
            entries.append(
                f'  {{ id: \'{q["id"]}\', text: "{text}", book: \'{book}\', section: \'{section}\' }}'
            )
        else:
            entries.append(
                f'  {{ id: \'{q["id"]}\', text: "{text}", book: \'{book}\' }}'
            )

    new_array = "export const VECIZELER: Vecize[] = [\n" + ",\n".join(entries) + ",\n];"

    # Replace the array in the file
    new_content = re.sub(
        r'export const VECIZELER: Vecize\[\] = \[.*?\];',
        new_array,
        content,
        flags=re.DOTALL,
    )

    QUOTES_TS.write_text(new_content, encoding='utf-8')
    print(f"Written {len(quotes)} quotes to {QUOTES_TS}")


def main():
    print("Running vecize extraction...")
    extracted = run_extraction()
    total_extracted = sum(len(v) for v in extracted.values())
    print(f"Extracted {total_extracted} quotes from {len(extracted)} books")

    print(f"Reading existing quotes from {QUOTES_TS}...")
    existing = read_existing_quotes()
    print(f"Found {len(existing)} existing quotes")

    print("Merging...")
    merged = merge(existing, extracted)
    print(f"Merged: {len(merged)} total quotes ({len(merged) - len(existing)} new)")

    # Report by book
    from collections import Counter
    book_counts = Counter(q["book"] for q in merged)
    for book, count in sorted(book_counts.items()):
        print(f"  {book}: {count}")

    print("\nWriting updated quotes.ts...")
    write_quotes_ts(merged)
    print("Done!")


if __name__ == "__main__":
    main()
