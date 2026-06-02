#!/usr/bin/env python3
"""
Risale-i Nur EPUB Verification Tool
Compares source markdown against generated EPUBs:
1. Word/sentence counts per book
2. Remaining markdown artifacts (###, **, etc.)
3. Empty sections
4. Dropped paragraphs
"""

import re
import sys
import zipfile
from pathlib import Path
from html.parser import HTMLParser

SOURCE_DIR = Path("C:/Users/silvestr.liskin/Desktop/risale_extraction/source_diyanet/obsidian-markdown")
EPUB_DIR = Path("C:/Users/silvestr.liskin/Desktop/risale-ai-studio/apps/readest-app/builtin-books")

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
    ("14 Muhakemat", "muhakemat"),
    ("15 Küçük Kitaplar", "kucuk-kitaplar"),
]

class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text = []
    def handle_data(self, data):
        self.text.append(data)

def extract_epub_text(epub_path):
    """Extract all text from EPUB xhtml files."""
    all_text = []
    try:
        with zipfile.ZipFile(epub_path) as zf:
            for name in zf.namelist():
                if name.endswith('.xhtml') and 'section_' in name:
                    html = zf.read(name).decode('utf-8')
                    parser = TextExtractor()
                    parser.feed(html)
                    all_text.append(' '.join(parser.text))
    except Exception as e:
        return f"ERROR: {e}"
    return ' '.join(all_text)

def clean_for_count(text):
    """Normalize text for word counting."""
    # Remove multiple spaces
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def find_markdown_artifacts(text):
    """Find remaining markdown syntax."""
    issues = []
    # Raw markdown headers
    m = re.findall(r'(?:^|\s)(#{1,6})\s', text)
    if m:
        issues.append(f"  ⚠ Raw headers: {len(m)} occurrences ({', '.join(set(m))})")
    # Raw bold/italic
    m = re.findall(r'\*\*[^*]+\*\*', text)
    if m:
        issues.append(f"  ⚠ Raw bold: {len(m)} occurrences")
    # Raw italic
    m = re.findall(r'(?<!\*)\*[^*]+\*(?!\*)', text)
    if m:
        issues.append(f"  ⚠ Raw italic: {len(m)} occurrences")
    # Raw footnote refs
    m = re.findall(r'\[\^[^\]]+\]', text)
    if m:
        issues.append(f"  ⚠ Raw footnote refs: {len(m)}")
    # HTML entities that shouldn't be there
    m = re.findall(r'&[a-z]+;', text)
    if m:
        bad = [x for x in set(m) if x not in ('&amp;', '&lt;', '&gt;', '&quot;')]
        if bad:
            issues.append(f"  ⚠ Unknown HTML entities: {bad}")
    return issues

def count_words(text):
    """Count words (Turkish-aware)."""
    return len(re.findall(r'\b\w+\b', text, re.UNICODE))

def count_sentences(text):
    """Count sentences."""
    return len(re.findall(r'[.!?…]+[\s"\']', text))

def main():
    print("=" * 70)
    print("RISALE-I NUR EPUB VERIFICATION")
    print("=" * 70)

    total_src_words = 0
    total_epub_words = 0
    all_issues = {}

    for src_dir_name, epub_slug in BOOKS:
        src_dir = SOURCE_DIR / src_dir_name
        epub_path = EPUB_DIR / f"{epub_slug}.epub"

        if not src_dir.exists():
            print(f"\n❌ {src_dir_name}: Source dir not found")
            continue
        if not epub_path.exists():
            print(f"\n❌ {epub_slug}: EPUB not found")
            continue

        # Read all source markdown
        src_text = []
        md_files = sorted(src_dir.glob("*.md"))
        for md_file in md_files:
            try:
                content = md_file.read_text(encoding='utf-8')
                # Remove YAML frontmatter
                content = re.sub(r'^---\s*\n.*?\n---\s*\n', '', content, flags=re.DOTALL)
                src_text.append(content)
            except:
                pass
        src_combined = clean_for_count(' '.join(src_text))

        # Extract EPUB text
        epub_combined = clean_for_count(extract_epub_text(epub_path))

        src_wc = count_words(src_combined)
        epub_wc = count_words(epub_combined)
        total_src_words += src_wc
        total_epub_words += epub_wc

        diff = src_wc - epub_wc
        pct = (diff / src_wc * 100) if src_wc > 0 else 0

        status = "✅" if abs(pct) < 2 else ("⚠️" if abs(pct) < 5 else "🔴")

        print(f"\n{status} {src_dir_name} ({epub_slug})")
        print(f"   Source: {src_wc:,} words | EPUB: {epub_wc:,} words | Diff: {diff:+,} ({pct:+.1f}%)")

        # Check for markdown artifacts in EPUB
        issues = find_markdown_artifacts(epub_combined)
        if issues:
            all_issues[epub_slug] = issues
            for issue in issues:
                print(issue)

        # Check for empty sections
        try:
            with zipfile.ZipFile(epub_path) as zf:
                for name in sorted(zf.namelist()):
                    if name.endswith('.xhtml') and 'section_' in name:
                        html = zf.read(name).decode('utf-8')
                        parser = TextExtractor()
                        parser.feed(html)
                        text = ' '.join(parser.text).strip()
                        if len(text) < 50:
                            print(f"  ⚠ Near-empty section: {name} ({len(text)} chars)")
        except:
            pass

    print("\n" + "=" * 70)
    print(f"TOTAL: Source {total_src_words:,} words → EPUB {total_epub_words:,} words")
    diff = total_src_words - total_epub_words
    pct = (diff / total_src_words * 100) if total_src_words > 0 else 0
    print(f"Difference: {diff:+,} words ({pct:+.1f}%)")
    print(f"Books with issues: {len(all_issues)}")
    print("=" * 70)

    if abs(pct) > 2:
        print("\n⚠️ WARNING: Significant word difference detected!")
        print("   Check the books above with 🔴 for potential text loss.")

    return 0 if abs(pct) < 3 else 1

if __name__ == "__main__":
    sys.exit(main())
