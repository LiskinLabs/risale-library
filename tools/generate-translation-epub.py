#!/usr/bin/env python3
"""
Risale Translation EPUB Generator

Converts Russian (and other language) .txt translation files to EPUB 3
with section structure matching the Turkish original for parallel view sync.

Input:  .txt files from risale_extraction/kitaplar/ (custom marker format)
Output: EPUB 3 in builtin-books/ and public/builtin-books/

Usage:
  PYTHONUTF8=1 python tools/generate-translation-epub.py --lang ru --book sozler
  PYTHONUTF8=1 python tools/generate-translation-epub.py --lang ru --all
"""

import argparse
import re
import shutil
import sys
import zipfile
from pathlib import Path
from xml.sax.saxutils import escape as xml_escape

ROOT = Path(__file__).parent.parent
KITAPLAR = Path("C:/Users/silvestr.liskin/Desktop/risale_extraction/kitaplar")
BUILTIN_DIR = ROOT / "apps" / "readest-app" / "builtin-books"
PUBLIC_DIR = ROOT / "apps" / "readest-app" / "public" / "builtin-books"

# ── Language config ─────────────────────────────────────────────────────

LANG_CONFIG = {
    "ru": {
        "name": "Russian",
        "lang": "ru",
        "prefix": "ru",
        "books": {
            "sozler":     {"title": "Слова", "author": "Бадиуззаман Саид Нурси", "ref_epub": "sozler.epub"},
            "lemalar":    {"title": "Лем'алар", "author": "Бадиуззаман Саид Нурси", "ref_epub": "lemalar.epub"},
            "mektubat":   {"title": "Мектубат", "author": "Бадиуззаман Саид Нурси", "ref_epub": "mektubat.epub"},
            "sualar":     {"title": "Шуалар", "author": "Бадиуззаман Саид Нурси", "ref_epub": "sualar.epub"},
            "mesnevi":    {"title": "Месневи-и Нурие", "author": "Бадиуззаман Саид Нурси", "ref_epub": "mesnevi-i-nuriye.epub"},
            "tarihce":    {"title": "История жизни", "author": "Бадиуззаман Саид Нурси", "ref_epub": "tarihce-i-hayat.epub"},
            "asamusa":    {"title": "Аса-йы Муса", "author": "Бадиуззаман Саид Нурси", "ref_epub": "asa-yi-musa.epub"},
            "emirdag1":   {"title": "Эмирдаг Ляхикасы-1", "author": "Бадиуззаман Саид Нурси", "ref_epub": "emirdag-lahikasi-1.epub"},
            "hutbe":      {"title": "Хутбе-и Шамие", "author": "Бадиуззаман Саид Нурси", "ref_epub": "kucuk-kitaplar.epub"},
            "hanimreh":   {"title": "Ханымлар Рехбери", "author": "Бадиуззаман Саид Нурси", "ref_epub": "kucuk-kitaplar.epub"},
            "nuralemianahtar": {"title": "Нур Алеми Анахтар", "author": "Бадиуззаман Саид Нурси", "ref_epub": "kucuk-kitaplar.epub"},
        },
    },
}

# ── CSS (matching Turkish EPUBs) ───────────────────────────────────────

CSS = r"""/* ── Risale Translation EPUB CSS ── */
body {
  font-family: "Minion Pro", "Georgia", "Noto Serif", serif;
  line-height: 1.85;
  text-align: justify;
  margin: 1.5rem;
  color: #2b2b2b;
  font-size: 1.1rem;
}
h1 {
  font-size: 1.8rem;
  font-weight: bold;
  text-align: center;
  margin: 2.5rem 0 1.5rem;
  line-height: 1.2;
  color: #8b191b;
  page-break-before: always;
  font-family: "ITC Souvenir", sans-serif;
}
h2 {
  font-size: 1.55rem;
  font-weight: bold;
  text-align: center;
  margin: 2rem 0 1rem;
  line-height: 1.3;
  color: #8b191b;
}
h3 {
  font-size: 1.35rem;
  font-weight: bold;
  text-align: center;
  margin: 1.7rem 0 0.9rem;
  color: #8b191b;
}
p { margin: 0 0 0.7rem; text-indent: 1.5em; }
p.no-indent { text-indent: 0; }
.arabic {
  font-family: "Traditional Arabic", "Scheherazade New", serif;
  font-size: 1.3rem;
  direction: rtl;
  text-align: right;
  display: block;
  margin: 0.8rem 0;
}
.arabic-inline {
  font-family: "Traditional Arabic", "Scheherazade New", serif;
  font-size: 1.2rem;
  direction: rtl;
}
.separator { text-align: center; color: #8b191b; margin: 2rem 0; font-size: 1.2rem; }
.metadata { text-align: center; font-style: italic; color: #666; margin: 1rem 0; }
"""

# ── Text parsing ────────────────────────────────────────────────────────

def parse_txt(content: str) -> list[dict]:
    """
    Parse Risale .txt format into sections.

    Returns list of: { type: 'header'|'paragraph'|'arabic'|'separator'|'metadata',
                       text: str, level: int (for headers) }
    """
    sections: list[dict] = []
    current_section: list[dict] = []

    lines = content.split('\n')

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        # Page markers: #N
        if re.match(r'^#\d+$', stripped):
            if current_section:
                sections.append({"type": "section", "children": current_section})
                current_section = []
            continue

        # Section headers: ∑...>
        if stripped.startswith('∑') and stripped.endswith('>'):
            if current_section:
                sections.append({"type": "section", "children": current_section})
                current_section = []
            title = stripped[1:-1].strip()
            current_section.append({"type": "header", "text": title, "level": 1})
            continue

        # Sub-headers: &...>
        if stripped.startswith('&') and stripped.endswith('>'):
            title = stripped[1:-1].strip()
            current_section.append({"type": "header", "text": title, "level": 2})
            continue

        # Arabic text: ~...@ or ~...|N@
        if stripped.startswith('~') and ('@' in stripped):
            arabic = stripped[1:].split('|')[0].rstrip('@').strip()
            current_section.append({"type": "arabic", "text": arabic})
            continue

        # Metadata/attribution: €...>
        if stripped.startswith('€') and stripped.endswith('>'):
            text = stripped[1:-1].strip()
            current_section.append({"type": "metadata", "text": text})
            continue

        # Separators: ,...>
        if stripped.startswith(',') and stripped.endswith('>'):
            current_section.append({"type": "separator", "text": stripped[1:-1].strip()})
            continue

        # Translation of Arabic: £...>  or with text
        if stripped.startswith('£') and stripped.endswith('>'):
            text = stripped[1:-1].strip()
            if text:
                current_section.append({"type": "paragraph", "text": text})
            continue

        # Dialogue markers: \...>
        if stripped.startswith('\\') and stripped.endswith('>'):
            text = stripped[1:-1].strip()
            if text:
                current_section.append({"type": "paragraph", "text": text, "style": "dialogue"})
            continue

        # Page number: just a number
        if re.match(r'^\d+$', stripped):
            current_section.append({"type": "page-break"})
            continue

        # Regular text paragraph
        # Clean up inline markers: \"text"> → text
        cleaned = re.sub(r'\\?"([^"]+)">', r'\1', stripped)
        cleaned = re.sub(r'~([^~@|]+)\|?\d*@', r'', cleaned)  # Remove inline Arabic refs
        cleaned = cleaned.strip()
        if cleaned:
            current_section.append({"type": "paragraph", "text": cleaned})

    if current_section:
        sections.append({"type": "section", "children": current_section})

    return sections


def section_to_html(section: dict) -> str:
    """Convert a parsed section to XHTML."""
    parts = ['<?xml version="1.0" encoding="UTF-8"?>']
    parts.append('<!DOCTYPE html>')
    parts.append('<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="ru" lang="ru">')
    parts.append('<head><meta charset="UTF-8"/><link rel="stylesheet" type="text/css" href="style.css"/></head>')
    parts.append('<body epub:type="bodymatter">')

    for child in section["children"]:
        if child["type"] == "header":
            level = child.get("level", 1)
            text = xml_escape(child["text"])
            parts.append(f'<h{level}>{text}</h{level}>')

        elif child["type"] == "paragraph":
            text = xml_escape(child["text"])
            cls = 'no-indent' if child.get("style") == "dialogue" else ''
            parts.append(f'<p class="{cls}">{text}</p>' if cls else f'<p>{text}</p>')

        elif child["type"] == "arabic":
            text = xml_escape(child["text"])
            parts.append(f'<div class="arabic">{text}</div>')

        elif child["type"] == "separator":
            text = xml_escape(child["text"]) if child["text"] else "* * *"
            parts.append(f'<div class="separator">{text}</div>')

        elif child["type"] == "metadata":
            text = xml_escape(child["text"])
            parts.append(f'<div class="metadata">{text}</div>')

        elif child["type"] == "page-break":
            pass  # Not needed in EPUB — pagination is dynamic

    parts.append('</body></html>')
    return '\n'.join(parts)


# ── EPUB generation ─────────────────────────────────────────────────────

def generate_epub(lang_code: str, book_key: str):
    """Generate a translation EPUB for one book."""
    config = LANG_CONFIG.get(lang_code)
    if not config:
        print(f"ERROR: Unknown language '{lang_code}'")
        sys.exit(1)

    book_cfg = config["books"].get(book_key)
    if not book_cfg:
        print(f"ERROR: Unknown book '{book_key}' for language '{lang_code}'")
        sys.exit(1)

    # Find source .txt file
    txt_dir = KITAPLAR / f"{config['prefix']}_{book_key}"
    if not txt_dir.exists():
        print(f"ERROR: Source directory not found: {txt_dir}")
        sys.exit(1)

    txt_files = sorted(txt_dir.glob("*.txt"))
    # Filter out _f (footnotes) and _h (headers) files — use the main text
    main_files = [f for f in txt_files if not f.stem.endswith(('_f', '_h'))]
    if not main_files:
        print(f"ERROR: No main .txt file found in {txt_dir}")
        sys.exit(1)

    txt_path = main_files[0]
    print(f"Source: {txt_path}")

    # Read and parse
    content = txt_path.read_text(encoding='utf-8')
    sections = parse_txt(content)
    print(f"Parsed {len(sections)} sections")

    # Generate EPUB filename
    epub_name = f"{config['prefix']}-{book_key}-parallel.epub"
    epub_path = BUILTIN_DIR / epub_name
    pub_path = PUBLIC_DIR / epub_name

    # Build EPUB
    book_id = f"urn:uuid:{book_key}-{lang_code}-parallel"
    with zipfile.ZipFile(epub_path, 'w') as zf:
        # mimetype — must be first, uncompressed
        zf.writestr('mimetype', 'application/epub+zip', compress_type=zipfile.ZIP_STORED)

        # Container
        zf.writestr('META-INF/container.xml', '''<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>''')

        # CSS
        zf.writestr('OEBPS/style.css', CSS)

        # Sections → XHTML files
        section_files = []
        for i, section in enumerate(sections):
            html = section_to_html(section)
            filename = f"section_{i+1:03d}.xhtml"
            zf.writestr(f'OEBPS/{filename}', html.encode('utf-8'))
            section_files.append((filename, section))

        # Build OPF
        manifest_items = []
        spine_items = []

        manifest_items.append('<item id="style" href="style.css" media-type="text/css"/>')
        manifest_items.append('<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>')

        for i, (filename, section) in enumerate(section_files):
            item_id = f"sec_{i+1:03d}"
            manifest_items.append(
                f'<item id="{item_id}" href="{filename}" media-type="application/xhtml+xml"/>'
            )
            spine_items.append(f'<itemref idref="{item_id}"/>')

        opf = f'''<?xml version="1.0" encoding="UTF-8"?>
<package version="3.0" unique-identifier="book-id" xmlns="http://www.idpf.org/2007/opf" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <metadata>
    <dc:identifier id="book-id">{book_id}</dc:identifier>
    <dc:title>{xml_escape(book_cfg["title"])}</dc:title>
    <dc:creator>{xml_escape(book_cfg["author"])}</dc:creator>
    <dc:language>{config["lang"]}</dc:language>
    <dc:publisher>Risale AI Studio</dc:publisher>
    <dc:date>2026</dc:date>
    <meta property="dcterms:modified">2026-06-04T00:00:00Z</meta>
  </metadata>
  <manifest>
    {chr(10).join("    " + item for item in manifest_items)}
  </manifest>
  <spine toc="ncx">
    {chr(10).join("    " + item for item in spine_items)}
  </spine>
</package>'''

        zf.writestr('OEBPS/content.opf', opf.encode('utf-8'))

        # Build NCX (TOC)
        nav_points = []
        for i, (filename, section) in enumerate(section_files):
            # Find first header in section for nav label
            label = f"Section {i+1}"
            for child in section.get("children", []):
                if child["type"] == "header":
                    label = child["text"][:80]
                    break
            nav_points.append(
                f'<navPoint id="nav-{i+1}" playOrder="{i+1}">'
                f'<navLabel><text>{xml_escape(label)}</text></navLabel>'
                f'<content src="{filename}"/>'
                f'</navPoint>'
            )

        ncx = f'''<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="{book_id}"/>
  </head>
  <docTitle><text>{xml_escape(book_cfg["title"])}</text></docTitle>
  <navMap>
    {chr(10).join("    " + p for p in nav_points)}
  </navMap>
</ncx>'''

        zf.writestr('OEBPS/toc.ncx', ncx.encode('utf-8'))

    # Copy to public/
    pub_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(epub_path, pub_path)

    size_kb = epub_path.stat().st_size / 1024
    print(f"Generated: {epub_path.name} ({size_kb:.0f} KB)")
    print(f"Copied to: {pub_path}")


def main():
    parser = argparse.ArgumentParser(description="Generate translation EPUBs for parallel view")
    parser.add_argument("--lang", default="ru", help="Language code (default: ru)")
    parser.add_argument("--book", help="Book key (e.g., sozler, lemalar)")
    parser.add_argument("--all", action="store_true", help="Generate all books for the language")
    args = parser.parse_args()

    lang = args.lang
    config = LANG_CONFIG.get(lang)
    if not config:
        print(f"ERROR: Unknown language '{lang}'. Available: {list(LANG_CONFIG.keys())}")
        sys.exit(1)

    if args.all:
        books = list(config["books"].keys())
        print(f"Generating {len(books)} books for {config['name']}...")
        for book_key in books:
            try:
                generate_epub(lang, book_key)
            except Exception as e:
                print(f"  FAILED {book_key}: {e}")
        print(f"\nDone! Generated EPUBs in {BUILTIN_DIR}/")
    elif args.book:
        generate_epub(lang, args.book)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
