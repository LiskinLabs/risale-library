#!/usr/bin/env python3
"""
Diyanet Verification: Compare Diyanet HTML (gold standard) vs generated EPUB.
Detects missing sentences, words, punctuation differences.
"""

import re
import sys
import zipfile
from pathlib import Path
from html.parser import HTMLParser
from difflib import SequenceMatcher

DIYANET_HTML = Path("C:/Users/silvestr.liskin/Desktop/risale_extraction/source_diyanet/html")
EPUB_DIR = Path("C:/Users/silvestr.liskin/Desktop/risale-ai-studio/apps/readest-app/builtin-books")

# Map Diyanet directory → EPUB slug
BOOKS = [
    ("01 Sözler", "sozler"),
    ("02 Mektubat", "mektubat"),
    ("03 Lem'alar", "lemalar"),
    ("04 Şuâlar", "sualar"),
    ("05 Tarihçe-i Hayat", "tarihce-i-hayat"),
    ("06 Mesnevî-i Nuriye", "mesnevi-i-nuriye"),
    ("07 İşaratü'l-i'caz", "isaratul-icaz"),
    ("08 Sikke-i Tasdik-i Gaybî", "sikke-i-tasdik-i-gaybi"),
    ("09 Barla Lâhikası", "barla-lahikasi"),
    ("10 Kastamonu Lâhikası", "kastamonu-lahikasi"),
    ("11 Emirdağ Lâhikası 1", "emirdag-lahikasi-1"),
    ("12 Emirdağ Lâhikası 2", "emirdag-lahikasi-2"),
    ("13 Asâ-yı Musa", "asa-yi-musa"),
    ("14 Küçük Kitaplar", "kucuk-kitaplar"),
]

SKIP_FILES = {"Fihrist", "İçindekiler", "indeks", "index", "TOC"}

class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []
        self._skip = False
    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style', 'nav', 'head'):
            self._skip = True
        elif tag in ('br', 'p', 'li', 'tr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div'):
            self.parts.append('\n')
    def handle_endtag(self, tag):
        if tag in ('script', 'style', 'nav', 'head'):
            self._skip = False
        elif tag in ('p', 'li', 'tr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div'):
            self.parts.append('\n')
    def handle_data(self, data):
        if not self._skip:
            self.parts.append(data)

def extract_html_text(html):
    """Extract clean text from Diyanet HTML."""
    p = TextExtractor()
    p.feed(html)
    return ' '.join(p.parts)

def extract_epub_text(epub_path):
    """Extract all text from EPUB xhtml sections."""
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
    """Normalize for comparison: collapse whitespace, lowercase."""
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def get_paragraphs(text):
    """Split text into paragraphs, filter empty."""
    paras = [normalize(p) for p in re.split(r'\n+', text)]
    return [p for p in paras if len(p) > 3]

def compare_texts(diyanet_text, epub_text, context=""):
    """Detailed comparison of two texts, reporting differences."""
    d_paras = get_paragraphs(diyanet_text)
    e_paras = get_paragraphs(epub_text)

    issues = []

    # Quick check: paragraph count
    if abs(len(d_paras) - len(e_paras)) > len(d_paras) * 0.1:
        issues.append(f"  ⚠ Paragraph count differs: Diyanet={len(d_paras)} vs EPUB={len(e_paras)}")

    # Character-level comparison
    d_chars = normalize(diyanet_text)
    e_chars = normalize(epub_text)

    # Word-level comparison with alignment
    d_words = re.findall(r'\S+', d_chars)
    e_words = re.findall(r'\S+', e_chars)

    if d_words and e_words:
        matcher = SequenceMatcher(None, d_words, e_words)
        matches = matcher.get_matching_blocks()

        # Find gaps
        d_idx = 0
        for match in matches:
            # Words in Diyanet before this match that aren't matched
            d_gap = d_words[d_idx:match.a]
            if d_gap and len(d_gap) > 0:
                gap_text = ' '.join(d_gap[:20])
                if len(d_gap) > 20:
                    gap_text += f" ... (+{len(d_gap)-20} more)"
                issues.append(f"  ❌ MISSING in EPUB ({len(d_gap)} words): «{gap_text[:200]}»")
            d_idx = match.a + match.size

        # Check for extra text in EPUB not in Diyanet
        e_idx = 0
        opcodes = matcher.get_opcodes()
        for tag, i1, i2, j1, j2 in opcodes:
            if tag == 'insert' and j2 - j1 > 3:
                extra = ' '.join(e_words[j1:j2][:20])
                issues.append(f"  ➕ EXTRA in EPUB ({j2-j1} words): «{extra[:200]}»")
            elif tag == 'delete' and i2 - i1 > 3:
                missing = ' '.join(d_words[i1:i2][:20])
                issues.append(f"  ❌ MISSING ({i2-i1} words): «{missing[:200]}»")
            elif tag == 'replace' and max(i2-i1, j2-j1) > 5:
                old = ' '.join(d_words[i1:i2][:15])
                new = ' '.join(e_words[j1:j2][:15])
                issues.append(f"  🔄 CHANGED: «{old[:100]}» → «{new[:100]}»")

    return issues

def main():
    print("=" * 70)
    print("DIYANET HTML vs EPUB — EXACT COMPARISON")
    print("Gold standard: Diyanet HTML (official printed book text)")
    print("=" * 70)

    total_d_words = 0
    total_e_words = 0
    total_issues = 0
    critical_books = []

    for dir_name, epub_slug in BOOKS:
        html_dir = DIYANET_HTML / dir_name
        epub_path = EPUB_DIR / f"{epub_slug}.epub"

        if not html_dir.exists():
            print(f"\n❌ {dir_name}: Diyanet HTML not found")
            continue
        if not epub_path.exists():
            print(f"\n❌ {epub_slug}: EPUB not found")
            continue

        # Read all Diyanet HTML files
        html_files = sorted([f for f in html_dir.glob("*.html")
                            if not any(s in f.stem for s in SKIP_FILES)])

        diyanet_full = []
        for hf in html_files:
            try:
                content = hf.read_text(encoding='utf-8')
                diyanet_full.append(extract_html_text(content))
            except:
                pass

        diyanet_combined = ' '.join(diyanet_full)

        # Extract EPUB text
        epub_sections = extract_epub_text(epub_path)
        epub_combined = ' '.join(epub_sections)

        d_wc = len(re.findall(r'\S+', normalize(diyanet_combined)))
        e_wc = len(re.findall(r'\S+', normalize(epub_combined)))
        total_d_words += d_wc
        total_e_words += e_wc

        issues = compare_texts(diyanet_combined, epub_combined, epub_slug)

        # Calculate match percentage
        if d_wc > 0:
            missing_words = sum(1 for i in issues if i.startswith("  ❌"))
            match_pct = (1 - missing_words / d_wc) * 100
        else:
            match_pct = 100

        status = "✅" if len(issues) == 0 else ("⚠️" if len(issues) < 5 else "🔴")
        print(f"\n{status} {dir_name}: {d_wc:,}→{e_wc:,} words | {len(issues)} issues | ~{match_pct:.1f}% match")

        if issues:
            total_issues += len(issues)
            for issue in issues[:8]:  # Show first 8 issues
                print(issue)
            if len(issues) > 8:
                print(f"  ... and {len(issues)-8} more issues")
            if len(issues) >= 10:
                critical_books.append((dir_name, len(issues)))

        # Per-section comparison for critical books
        if len(issues) >= 3 and len(epub_sections) == len(html_files):
            section_issues = 0
            for i, (hf, es) in enumerate(zip(html_files, epub_sections)):
                sec_issues = compare_texts(extract_html_text(hf.read_text(encoding='utf-8')),
                                          es, f"  section {i+1}")
                if sec_issues:
                    section_issues += 1
                    if section_issues <= 3:  # Show first 3 sections with issues
                        print(f"  📍 {hf.stem}:")
                        for si in sec_issues[:2]:
                            print(f"    {si}")

    print("\n" + "=" * 70)
    print(f"TOTAL: Diyanet {total_d_words:,} → EPUB {total_e_words:,} words")
    if total_d_words > 0:
        diff = abs(total_d_words - total_e_words)
        pct = diff / total_d_words * 100
        print(f"Overall word difference: {diff:,} ({pct:.2f}%)")
    print(f"Books with issues: {len([b for b,_ in BOOKS if any(True for _ in [])])}")
    if critical_books:
        print(f"Critical books (10+ issues): {len(critical_books)}")
        for name, count in critical_books:
            print(f"  🔴 {name}: {count} issues")
    print("=" * 70)

    return 1 if critical_books else 0

if __name__ == "__main__":
    sys.exit(main())
