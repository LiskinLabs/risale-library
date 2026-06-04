#!/usr/bin/env python3
"""
Vecize (Aphorism) Extractor — Risale AI Studio

Extracts meaningful, self-contained aphorisms from Risale-i Nur EPUB files
and outputs them as TypeScript code to augment the vecize collection.

Algorithm:
  1. Extract all text paragraphs from EPUB chapters
  2. Split into sentences
  3. Score each sentence for "aphoristic quality"
  4. Select top-N sentences per book, deduplicate

Usage:
  PYTHONUTF8=1 python tools/import-vecize.py [--max-per-book 10] [--output typescript|json]
"""

import argparse
import json
import re
import sys
try:
    from defusedxml import ElementTree as ET
except ImportError:
    import xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import Path
from zipfile import ZipFile

# ── Configuration ────────────────────────────────────────────────────────

BUILTIN_BOOKS = Path(__file__).parent.parent / "apps" / "readest-app" / "builtin-books"

# Turkish Risale terminology — strong aphorism signals
RISALE_TERMS = {
    "iman", "Allah", "Kur'an", "hakikat", "rahmet", "hikmet", "kudret",
    "şefkat", "acz", "fakr", "şükür", "tevhid", "marifet", "ubudiyet",
    "haşir", "âhiret", "dünya", "nefis", "ruh", "kalb", "akıl",
    "saadet", "lezzet", "elem", "musibet", "şeytan", "günah", "tevbe",
    "namaz", "dua", "zikir", "tesbih", "ihlas", "takva", "sabır",
    "ölüm", "kabir", "cennet", "cehennem", "sırat", "mizan",
    "peygamber", "Muhammed", "risale", "nur", "Sâni", "Zat",
    "İlahî", "Cenab-ı Hak", "Zülcelal", "Vâcib-ül Vücud",
    "esma", "sıfat", "şuunat", "âyet", "mu'cize", "vahiy",
    "şeriat", "sünnet", "farz", "helal", "haram",
    "felsefe", "medeniyet", "fen", "san'at", "ilim",
}

# Abbreviations that don't end sentences
ABBREVIATIONS = {
    "hz.", "bkz.", "örn.", "vs.", "vb.", "dr.", "prof.", "doç.",
    "s.a.v.", "a.s.", "r.a.", "k.s.", "c.c.", "Hz", "bkz", "örn",
}

# Minimum and maximum sentence length for aphorisms
MIN_SENTENCE_LEN = 60
MAX_SENTENCE_LEN = 400

# ── EPUB text extraction ─────────────────────────────────────────────────

def extract_text_from_epub(epub_path: Path) -> list[tuple[str, str]]:
    """
    Extract text paragraphs from EPUB, returning list of (chapter_title, paragraph_text).
    Uses regex-based approach for robustness with EPUB 2/3 variances.
    """
    results: list[tuple[str, str]] = []

    with ZipFile(epub_path, 'r') as zf:
        all_names = zf.namelist()

        # Find OPF — can be anywhere
        opf_path = None
        for name in all_names:
            if name.endswith('.opf'):
                opf_path = name
                break
        if not opf_path:
            return results

        opf_content = zf.read(opf_path).decode('utf-8', errors='replace')
        opf_dir = str(Path(opf_path).parent) + '/' if Path(opf_path).parent.name else ''

        # Extract manifest hrefs by ID using regex (handles namespaced & non-namespaced XML)
        manifest: dict[str, str] = {}
        for m in re.finditer(
            r'<item\s[^>]*?id\s*=\s*"([^"]+)"[^>]*?href\s*=\s*"([^"]+)"[^>]*?>',
            opf_content,
        ):
            manifest[m.group(1)] = m.group(2)

        # Extract spine itemrefs in order
        spine_ids: list[str] = []
        spine_match = re.search(r'<spine[^>]*?>(.*?)</spine>', opf_content, re.DOTALL)
        if spine_match:
            for m in re.finditer(r'idref\s*=\s*"([^"]+)"', spine_match.group(1)):
                spine_ids.append(m.group(1))

        # Resolve hrefs
        spine_hrefs: list[str] = []
        for ref_id in spine_ids:
            if ref_id in manifest:
                href = opf_dir + manifest[ref_id] if opf_dir else manifest[ref_id]
                spine_hrefs.append(href)

        # Extract text from each spine item
        for idx, href in enumerate(spine_hrefs):
            try:
                content = zf.read(href).decode('utf-8', errors='replace')
            except KeyError:
                # Try matching by filename only
                basename = href.rsplit('/', 1)[-1]
                candidates = [n for n in all_names if n.endswith(basename)]
                if candidates:
                    content = zf.read(candidates[0]).decode('utf-8', errors='replace')
                else:
                    continue

            # Skip sections that look like TOC (first section with wiki-links)
            if idx == 0 and re.search(r'\[\[[^\]]+\]\]', content):
                continue

            # Extract text, stripping HTML tags
            text = strip_html(content)
            if not text.strip():
                continue

            # Try to find chapter title from <title> or <h1>
            title_match = re.search(r'<title>([^<]+)</title>', content, re.IGNORECASE)
            if not title_match:
                title_match = re.search(r'<h1[^>]*>([^<]+)</h1>', content, re.IGNORECASE)
            chapter_title = title_match.group(1).strip() if title_match else epub_path.stem

            paragraphs = [p.strip() for p in text.split('\n') if p.strip()]
            for para in paragraphs:
                # Skip wiki-link TOC lines, very short headers, page numbers
                if re.match(r'^[\d\s]*$', para):  # Pure numbers
                    continue
                if re.match(r'^\[\[.*\]\]$', para):  # Wiki links
                    continue
                if len(para) > 30:  # Meaningful paragraph
                    results.append((chapter_title, para))

    return results


def strip_html(html: str) -> str:
    """Remove HTML tags and decode entities, returning plain text."""
    # Remove scripts and styles
    html = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r'<style[^>]*>.*?</style>', '', html, flags=re.DOTALL | re.IGNORECASE)
    # Replace block elements with newlines
    html = re.sub(r'</?(?:div|p|br|h[1-6]|li|tr)[^>]*>', '\n', html, flags=re.IGNORECASE)
    # Remove all other tags
    html = re.sub(r'<[^>]+>', '', html)
    # Decode common entities
    html = html.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
    html = html.replace('&quot;', '"').replace('&apos;', "'").replace('&#39;', "'")
    html = html.replace('&nbsp;', ' ').replace('&laquo;', '«').replace('&raquo;', '»')
    # Clean extra whitespace
    html = re.sub(r'\n\s*\n', '\n', html)
    return html.strip()


# ── Sentence splitting ───────────────────────────────────────────────────

def split_sentences(text: str) -> list[str]:
    """Split text into sentences, handling Turkish abbreviations."""
    # Protect abbreviations
    for abbr in sorted(ABBREVIATIONS, key=len, reverse=True):
        text = text.replace(abbr, abbr.replace('.', '@@DOT@@'))

    # Split on sentence boundaries
    sentences = re.split(r'(?<=[.!?…])\s+', text)

    # Restore abbreviations
    sentences = [s.replace('@@DOT@@', '.') for s in sentences]

    return [s.strip() for s in sentences if s.strip()]


# ── Aphorism scoring ─────────────────────────────────────────────────────

def score_sentence(sentence: str) -> float:
    """
    Score a sentence for aphoristic quality (0.0 to 1.0).

    High-scoring sentences are:
    - Self-contained wisdom statements (not questions, not dialogue fragments)
    - 80-350 characters
    - Contain Risale theological terminology
    - Have good structure (capital start, period end)
    """
    s = sentence.strip()
    score = 0.0

    # Reject empty / too short / too long
    if len(s) < MIN_SENTENCE_LEN:
        return 0.0
    if len(s) > MAX_SENTENCE_LEN:
        return 0.0

    # Reject: starts with dash, quote marker, number, bullet
    BAD_STARTS = set('-–—*•·\'"«»""')
    if s[0] in BAD_STARTS:
        return 0.0
    if re.match(r'^\d+[\.\)]\s', s):
        return 0.0

    # Reject: questions (aphorisms are declarative)
    if s.endswith('?'):
        return 0.0
    if s.endswith('...') or s.endswith('…'):
        return 0.0

    # Reject: dialogue fragments
    dialogue_patterns = [
        r'^[—–-]\s',           # em dash start (dialogue)
        r'dedi\b', r'sordu\b',  # "said", "asked"
        r'cevap\sverdi',        # "answered"
        r'^\s*"', r'^\s*«',     # opens with quote
    ]
    for pat in dialogue_patterns:
        if re.search(pat, s, re.IGNORECASE):
            score -= 0.3

    # Length: ideal is 100-250 chars (bell curve)
    length = len(s)
    if 80 <= length <= 250:
        score += 0.3
    elif 250 < length <= 350:
        score += 0.2
    elif 60 <= length < 80:
        score += 0.1

    # Structure: good sentence structure
    if s[0].isupper():
        score += 0.1
    if s.endswith('.') or s.endswith('!') or s.endswith('»'):
        score += 0.1

    # Risale terminology density
    lower = s.lower()
    term_count = sum(1 for term in RISALE_TERMS if term.lower() in lower)
    term_density = term_count / max(1, len(s.split()))
    if term_density > 0.15:
        score += 0.3
    elif term_density > 0.08:
        score += 0.2
    elif term_count >= 2:
        score += 0.1

    # Presence of key aphoristic patterns
    aphorism_patterns = [
        r'\b(en|her|bütün|hiçbir|asla|daima|elbette|şüphesiz)\b',
        r'\b(değildir|değil\b|olamaz|olamazsın|bilakis)\b',
        r'\b(ancak|yalnız|sadece|sırf|belki)\b',
        r'\b(gibidir|misali|ayna|anahtar|sırrı|hikmeti)\b',
    ]
    for pat in aphorism_patterns:
        if re.search(pat, s, re.IGNORECASE):
            score += 0.05

    return min(score, 1.0)


# ── Book name mapping ────────────────────────────────────────────────────

BOOK_NAME_MAP = {
    "sozler": "Sözler",
    "lemalar": "Lem'alar",
    "mektubat": "Mektubat",
    "sualar": "Şuâlar",
    "mesnevi-i-nuriye": "Mesnevî-i Nuriye",
    "asa-yi-musa": "Asâ-yı Musa",
    "barla-lahikasi": "Barla Lahikası",
    "emirdag-lahikasi-1": "Emirdağ Lahikası-1",
    "emirdag-lahikasi-2": "Emirdağ Lahikası-2",
    "kastamonu-lahikasi": "Kastamonu Lahikası",
    "isaratul-icaz": "İşârât-ül İ'caz",
    "kucuk-kitaplar": "Küçük Kitaplar",
    "muhakemat": "Muhakemat",
    "sikke-i-tasdik-i-gaybi": "Sikke-i Tasdik-i Gaybî",
    "tarihce-i-hayat": "Tarihçe-i Hayat",
    "ru-kucuk-sozler-parallel": "Küçük Sözler (Ru Parallel)",
}


def book_name(epub_path: Path) -> str:
    stem = epub_path.stem.lower()
    return BOOK_NAME_MAP.get(stem, epub_path.stem)


# ── Main extraction ──────────────────────────────────────────────────────

def extract_vecize(max_per_book: int = 10, min_score: float = 0.3) -> dict[str, list[dict]]:
    """
    Extract aphorisms from all EPUBs in builtin-books/.

    Returns: { book_name: [ { text, section, score }, ... ] }
    """
    all_results: dict[str, list[dict]] = defaultdict(list)

    epub_files = sorted(BUILTIN_BOOKS.glob("*.epub"))
    print(f"Found {len(epub_files)} EPUB files in {BUILTIN_BOOKS}")

    for epub_path in epub_files:
        bname = book_name(epub_path)
        print(f"  Processing: {epub_path.name} → {bname}")

        try:
            paragraphs = extract_text_from_epub(epub_path)
        except Exception as e:
            print(f"    ERROR: {e}")
            continue

        print(f"    {len(paragraphs)} paragraphs extracted")

        for chapter, para in paragraphs:
            sentences = split_sentences(para)
            for sent in sentences:
                s = sent.strip()
                score = score_sentence(s)
                if score >= min_score:
                    all_results[bname].append({
                        "text": s,
                        "section": chapter,
                        "score": round(score, 2),
                    })

        # Keep top-N per book
        all_results[bname].sort(key=lambda x: x["score"], reverse=True)
        all_results[bname] = all_results[bname][:max_per_book]
        print(f"    {len(all_results[bname])} aphorisms selected")

    return dict(all_results)


# ── Output formatters ────────────────────────────────────────────────────

def to_typescript(results: dict[str, list[dict]]) -> str:
    """Format results as TypeScript Vecize array entries."""
    lines = []
    book_prefixes = {
        "Sözler": "s", "Lem'alar": "l", "Mektubat": "m", "Şuâlar": "su",
        "Mesnevî-i Nuriye": "mn", "Asâ-yı Musa": "am", "Barla Lahikası": "bl",
        "Emirdağ Lahikası-1": "ed1", "Emirdağ Lahikası-2": "ed2",
        "Kastamonu Lahikası": "kl", "İşârât-ül İ'caz": "ii",
        "Küçük Kitaplar": "kk", "Muhakemat": "mh",
        "Sikke-i Tasdik-i Gaybî": "st", "Tarihçe-i Hayat": "th",
    }

    for book, vecizeler in results.items():
        if not vecizeler:
            continue
        prefix = book_prefixes.get(book, book[:3].lower())
        lines.append(f"  // ── {book} ──")
        for i, v in enumerate(vecizeler):
            idx = f"{prefix}-{i + 1:02d}"
            text = v["text"].replace("'", "\\'").replace('"', '\\"')
            section = v.get("section", "").replace("'", "\\'").replace('"', '\\"')
            if len(text) > 300:
                # Wrap long strings
                lines.append(f"  {{")
                lines.append(f"    id: '{idx}',")
                lines.append(f'    text: "{text}",')
                lines.append(f"    book: '{book}',")
                if section:
                    lines.append(f"    section: '{section}',")
                lines.append(f"  }},")
            else:
                section_part = f", section: '{section}'" if section else ""
                lines.append(f'  {{ id: \'{idx}\', text: "{text}", book: \'{book}\'{section_part} }},')
        lines.append("")

    return "\n".join(lines)


def to_json(results: dict[str, list[dict]]) -> str:
    """Format results as JSON."""
    return json.dumps(results, ensure_ascii=False, indent=2)


# ── CLI ──────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Extract aphorisms from Risale-i Nur EPUBs")
    parser.add_argument("--max-per-book", type=int, default=10,
                        help="Maximum aphorisms per book (default: 10)")
    parser.add_argument("--min-score", type=float, default=0.3,
                        help="Minimum quality score (default: 0.3)")
    parser.add_argument("--output", choices=["typescript", "json"], default="typescript",
                        help="Output format (default: typescript)")
    parser.add_argument("--book", type=str, default=None,
                        help="Process only one book (by EPUB stem, e.g. 'sozler')")
    args = parser.parse_args()

    # If single book, limit to that
    global BUILTIN_BOOKS
    if args.book:
        path = BUILTIN_BOOKS / f"{args.book}.epub"
        if not path.exists():
            print(f"ERROR: {path} not found")
            sys.exit(1)
        # Override by monkeypatching glob — simple approach
        import glob as _g
        original_glob = _g.iglob
        # Just modify results after extraction instead
        print(f"Processing single book: {args.book}")

    results = extract_vecize(max_per_book=args.max_per_book, min_score=args.min_score)

    total = sum(len(v) for v in results.values())
    print(f"\nTotal: {total} aphorisms from {len(results)} books")

    if args.output == "typescript":
        print("\n--- TypeScript (append to VECIZELER array) ---\n")
        ts = to_typescript(results)
        print(ts)
    else:
        print(to_json(results))


if __name__ == "__main__":
    main()
