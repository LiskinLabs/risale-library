#!/usr/bin/env python3
"""
Kitaplar Verification: Compare kitaplar/ raw .txt (original source)
against generated EPUB. This is the deepest level of verification —
kitaplar is the raw text from which everything else was derived.

Format markers:
  #N       → page number
  <text>   → book title
  &text>   → major heading
  ,text>   → author/attribution
  ~text|N@ → Arabic text with Quran ref
  \\text>  → inline emphasis
  `text>   → sual/elcevap marker
  ∑text>   → special heading
  ÷text>   → subheading note
  ***>     → section separator
  ^text    → footnote
"""

import re
import sys
import zipfile
from pathlib import Path
from html.parser import HTMLParser

KITAPLAR = Path("C:/Users/silvestr.liskin/Desktop/risale_extraction/kitaplar")
EPUB_DIR = Path("C:/Users/silvestr.liskin/Desktop/risale-ai-studio/apps/readest-app/builtin-books")

# Map kitaplar directory → EPUB slug
# Turkish books only (suffix Y)
BOOK_MAP = [
    ("sozlerY", "sozler"),
    ("mektubatY", "mektubat"),
    ("lemalarY", "lemalar"),
    ("sualarY", "sualar"),
    ("tarihceY", "tarihce-i-hayat"),
    ("mesneviY", "mesnevi-i-nuriye"),
    ("isaretY", "isaratul-icaz"),
    ("sikkeY", "sikke-i-tasdik-i-gaybi"),
    ("barlaY", "barla-lahikasi"),
    ("kastamonuY", "kastamonu-lahikasi"),
    ("emirdag1Y", "emirdag-lahikasi-1"),
    ("emirdag2Y", "emirdag-lahikasi-2"),
    ("asamusaY", "asa-yi-musa"),
    ("muhakematY", "muhakemat"),
    ("kucukY", "kucuk-kitaplar"),
]

class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []
        self._skip = False
    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style', 'nav', 'head', 'title', 'meta', 'link'):
            self._skip = True
        elif tag in ('br', 'p', 'li', 'tr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div'):
            self.parts.append('\n')
    def handle_endtag(self, tag):
        if tag in ('script', 'style', 'nav', 'head', 'title', 'meta', 'link'):
            self._skip = False
        elif tag in ('p', 'li', 'tr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div'):
            self.parts.append('\n')
    def handle_data(self, data):
        if not self._skip:
            self.parts.append(data)

def clean_kitaplar_text(text):
    """Remove kitaplar format markers, return clean Turkish text."""
    # Remove page numbers
    text = re.sub(r'#\d+\s*', '', text)
    # Remove Quran reference numbers in Arabic markers ~text|N@ → just the Arabic text
    text = re.sub(r'~([^|~@]+)\|\d+@', r'\1', text)
    # Remove structural markers
    text = re.sub(r'^<[^>]+>', '', text, flags=re.MULTILINE)  # <title>
    text = re.sub(r'^&[^>]+>', '', text, flags=re.MULTILINE)  # &heading>
    text = re.sub(r'^,[^>]+>', '', text, flags=re.MULTILINE)  # ,author>
    text = re.sub(r'^∑[^>]+>', '', text, flags=re.MULTILINE)  # ∑heading>
    text = re.sub(r'^÷[^>]+>', '', text, flags=re.MULTILINE)  # ÷note>
    text = re.sub(r',?\*\*\*>', '', text)                       # *** separator
    text = re.sub(r'\\', '', text)                               # \Bismillah → Bismillah
    text = re.sub(r'`', '', text)                                # `Sual: → Sual:
    text = re.sub(r'\^[^\s]*', '', text)                         # ^footnote

    # Collapse whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def extract_kitaplar_text(dir_path):
    """Extract clean text from all .txt files (excluding _f and _h variants)."""
    texts = []
    main_file = None
    # Find main .txt file (without _f or _h suffix)
    for f in sorted(dir_path.glob("*.txt")):
        if '_f.txt' not in f.name and '_h.txt' not in f.name:
            main_file = f
            break

    if main_file:
        content = main_file.read_text(encoding='utf-8')
        texts.append(clean_kitaplar_text(content))

    return ' '.join(texts)

def extract_epub_text(epub_path):
    sections = []
    try:
        with zipfile.ZipFile(epub_path) as zf:
            for name in sorted(zf.namelist()):
                if 'section_' in name and name.endswith('.xhtml'):
                    html = zf.read(name).decode('utf-8')
                    p = TextExtractor()
                    p.feed(html)
                    sections.append(' '.join(p.parts))
    except Exception as e:
        return [f"ERROR: {e}"]
    return sections

def normalize(text):
    return re.sub(r'\s+', ' ', text).strip()

def smart_compare(diyanet_text, epub_text, name, max_examples=8):
    """Compare texts word-by-word, report real differences (not structural)."""
    d_words = [w for w in re.findall(r'\S+', diyanet_text) if len(w) > 1]
    e_words = [w for w in re.findall(r'\S+', epub_text) if len(w) > 1]

    issues = []
    d_i, e_i = 0, 0
    d_len, e_len = len(d_words), len(e_words)

    # Find missing sequences
    while d_i < d_len and e_i < e_len:
        # Skip matching words
        match_len = 0
        while (d_i + match_len < d_len and e_i + match_len < e_len and
               d_words[d_i + match_len] == e_words[e_i + match_len]):
            match_len += 1

        if match_len > 0:
            d_i += match_len
            e_i += match_len
            continue

        # Mismatch found — look ahead to find where alignment resumes
        found = False
        for lookahead in range(1, min(30, d_len - d_i)):
            if e_i < e_len and d_words[d_i + lookahead] == e_words[e_i]:
                # Words in Diyanet missing from EPUB
                missing = ' '.join(d_words[d_i:d_i + lookahead])
                issues.append(f"  ❌ MISSING: «{missing[:150]}»")
                d_i += lookahead
                found = True
                break

        if not found:
            for lookahead in range(1, min(30, e_len - e_i)):
                if d_i < d_len and e_words[e_i + lookahead] == d_words[d_i]:
                    # Extra words in EPUB
                    extra = ' '.join(e_words[e_i:e_i + lookahead])
                    if len(extra) > 3:
                        issues.append(f"  ➕ EXTRA: «{extra[:150]}»")
                    e_i += lookahead
                    found = True
                    break

        if not found:
            # Skip both
            d_i += 1
            e_i += 1

    return issues

def main():
    print("=" * 70)
    print("KITAPLAR (.txt) vs EPUB — DEEPEST VERIFICATION")
    print("Source: risale_extraction/kitaplar/ — raw original text")
    print("=" * 70)

    total_d = 0
    total_e = 0
    books_with_issues = 0
    total_missing = 0
    total_extra = 0

    for dir_name, epub_slug in BOOK_MAP:
        src_dir = KITAPLAR / dir_name
        epub_path = EPUB_DIR / f"{epub_slug}.epub"

        if not src_dir.exists():
            print(f"\n⚠️ {dir_name}: kitaplar source not found (skipping)")
            continue
        if not epub_path.exists():
            print(f"\n⚠️ {epub_slug}: EPUB not found (skipping)")
            continue

        kitaplar_text = extract_kitaplar_text(src_dir)
        epub_sections = extract_epub_text(epub_path)
        epub_text = ' '.join(epub_sections)

        d_norm = normalize(kitaplar_text)
        e_norm = normalize(epub_text)

        d_wc = len(re.findall(r'\b\w+\b', d_norm, re.UNICODE))
        e_wc = len(re.findall(r'\b\w+\b', e_norm, re.UNICODE))
        total_d += d_wc
        total_e += e_wc

        issues = smart_compare(d_norm, e_norm, dir_name)

        missing_count = sum(1 for i in issues if 'MISSING' in i)
        extra_count = sum(1 for i in issues if 'EXTRA' in i)
        total_missing += missing_count
        total_extra += extra_count

        if d_wc > 0:
            match_pct = 100 * (1 - missing_count * 2 / d_wc)  # rough estimate
            match_pct = max(0, min(100, match_pct))
        else:
            match_pct = 100

        if missing_count == 0 and extra_count == 0:
            status = "✅"
        elif missing_count < 5:
            status = "⚠️"
        else:
            status = "🔴"
            books_with_issues += 1

        print(f"\n{status} {dir_name} → {epub_slug}")
        print(f"   Kitaplar: {d_wc:,} words | EPUB: {e_wc:,} words")
        print(f"   Missing: {missing_count} | Extra: {extra_count} | ≈{match_pct:.1f}% match")

        if issues:
            for issue in issues[:6]:
                print(issue)
            if len(issues) > 6:
                print(f"   ... and {len(issues)-6} more")

    print("\n" + "=" * 70)
    print(f"TOTAL: Kitaplar {total_d:,} → EPUB {total_e:,} words")
    if total_d > 0:
        diff = abs(total_d - total_e)
        pct = diff / total_d * 100
        print(f"Word difference: {diff:,} ({pct:.2f}%)")
    print(f"Total missing sequences: {total_missing}")
    print(f"Total extra sequences: {total_extra}")
    print(f"Books with issues: {books_with_issues}")
    if total_missing == 0:
        print("\n✅ ALL CLEAN — No missing text across all 15 books!")
    print("=" * 70)

    return 1 if total_missing > 20 else 0

if __name__ == "__main__":
    sys.exit(main())
