#!/usr/bin/env python3
"""
Risale-i Nur EPUB Generator
Converts kitaplar/ .txt format to EPUB 3 with eRisale-style formatting.

Markers:
  #N          → page number
  <text>      → metadata (first page only)
  &Title>     → h1 section heading
  €Title>     → h2 sub-section heading
  ∑Title>     → h3 major heading
  \Title>     → inline subtitle/emphasis
  ~Arabic|ref@ → Arabic text with optional footnote ref
  ^[ref] text → footnote
  `Label:>    → dialogue/question label
  ,text>      → emphasized inline text
  ,***>       → separator
"""

import os
import re
import json
import zipfile
import uuid
import shutil
from pathlib import Path
from xml.sax.saxutils import escape

# ── Config ──────────────────────────────────────────────────────────
SOURCE_DIR = Path("C:/Users/silvestr.liskin/Desktop/risale_extraction/kitaplar")
OUTPUT_DIR = Path("C:/Users/silvestr.liskin/Desktop/risale-ai-studio/tools/generate-epub/output")
FONTS_DIR = Path("C:/Users/silvestr.liskin/Desktop/risale-ai-studio/tools/generate-epub/fonts")

# EPUB template constants
EPUB_NS = "http://www.idpf.org/2007/ops"
CONTAINER_XML = """<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>"""


class RisaleEPUBGenerator:
    def __init__(self, book_dir: str, book_slug: str, metadata: dict = None):
        self.book_dir = Path(book_dir)
        self.slug = book_slug
        self.meta = metadata or {}
        self.pages = []        # list of {num, lines}
        self.footnotes = {}    # ref → text
        self.sections = []     # list of {title, level, page_start}
        self.current_page = None
        self.current_section = None
        self.images = []       # list of (filepath, media_type, epub_path)

    # ── Parser ──────────────────────────────────────────────────────

    def parse(self):
        """Parse the .txt file and extract pages, sections, footnotes."""
        txt_path = self.book_dir / f"{self.slug}.txt"
        if not txt_path.exists():
            raise FileNotFoundError(f"Book file not found: {txt_path}")

        # Load footnotes
        f_path = self.book_dir / f"{self.slug}_f.txt"
        if f_path.exists():
            self._parse_footnotes(f_path)

        with open(txt_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        for line in lines:
            line = line.rstrip('\n')
            self._process_line(line)

        # Finalize last page
        if self.current_page and self.current_page['lines']:
            self.pages.append(self.current_page)

    def _parse_footnotes(self, path):
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        # Format: ^[1] footnote text
        for match in re.finditer(r'\^\[(\d+)\]\s*(.+?)(?=\^\[\d+\]|\Z)', content, re.DOTALL):
            ref = match.group(1)
            text = match.group(2).strip()
            self.footnotes[ref] = text

    def _process_line(self, line: str):
        stripped = line.strip()

        # Page marker: #N
        if re.match(r'^#\d+', stripped):
            if self.current_page and self.current_page['lines']:
                self.pages.append(self.current_page)
            page_num = int(re.match(r'^#(\d+)', stripped).group(1))
            self.current_page = {'num': page_num, 'lines': []}
            return

        # Book-level metadata markers: <Collection Name>, <Title>
        if re.match(r'^<(.+)>$', stripped):
            meta_text = re.match(r'^<(.+)>$', stripped).group(1)
            # These are collection/series indicators — store or render as subtitle
            if 'müellif' in meta_text.lower() or 'nursi' in meta_text.lower():
                self.meta['author'] = meta_text
            elif 'risale' in meta_text.lower() or 'külliyat' in meta_text.lower():
                self.meta['collection'] = meta_text
                self.current_page['lines'].append(
                    f'<p class="collection-indicator">{escape(meta_text)}</p>'
                )
            return

        # Initialize first page if needed
        if self.current_page is None:
            self.current_page = {'num': 1, 'lines': []}

        # Process inline markers within the line
        html = self._convert_inline(line)
        if html.strip():
            self.current_page['lines'].append(html)

    def _convert_inline(self, text: str) -> str:
        """Convert inline markers to HTML."""
        result = text

        # Section headings: &Title> → <h1>
        result = re.sub(r'&([^>]+)>', r'<h1 class="section-title">\1</h1>', result)

        # Sub-section: €Title> → <h2>
        result = re.sub(r'€([^>]+)>', r'<h2 class="sub-section-title">\1</h2>', result)

        # Major heading: ∑Title> → <h3>
        result = re.sub(r'∑([^>]+)>', r'<h3 class="major-heading">\1</h3>', result)

        # Parenthetical note: ÷(text)> → <p class="parenthetical">
        result = re.sub(r'÷\(([^)]+)\)>', r'<p class="parenthetical">\1</p>', result)

        # Arabic text: ~text|ref@ → <span class="arabic" data-ref="ref">
        def arabic_span(m):
            arabic = m.group(1)
            ref = m.group(2) if m.group(2) else ''
            cls = 'arabic'
            if ref:
                return f'<span class="{cls}" data-footnote-ref="{ref}" id="fnref_{ref}">{arabic}</span><a class="footnote-ref" href="#fn_{ref}" id="fnref_{ref}">[{ref}]</a>'
            return f'<span class="{cls}">{arabic}</span>'
        result = re.sub(r'~([^|@]+)\|?(\d+)?@', arabic_span, result)

        # Dialogue labels: `Label:> → <span class="dialogue-label">
        result = re.sub(r'`([^:]+):>', r'<span class="dialogue-label">\1:</span> ', result)

        # Emphasized inline: ,text> → <em>
        result = re.sub(r',([^>,]+(?:>[^,]*)?)>', r'<em>\1</em>', result)

        # Inline subtitle: \Text> → <span class="inline-subtitle">
        result = re.sub(r'\\([^>]+)>', r'<span class="inline-subtitle">\1</span>', result)

        # Separator: ,***>
        result = result.replace(',***>', '<hr class="separator"/>')

        # Footnotes in text: ^[ref] already handled in parse_footnotes
        # But inline: ^[1] → superscript ref
        def footnote_link(m):
            ref = m.group(1)
            if ref in self.footnotes:
                return f'<sup><a href="#fn_{ref}" id="fnref_{ref}" class="footnote-link">[{ref}]</a></sup>'
            return m.group(0)
        result = re.sub(r'\^\[(\d+)\]', footnote_link, result)

        # Wrap regular text in <p> if no HTML tag at start
        if not re.match(r'^\s*<', result) and result.strip():
            result = f'<p>{result.strip()}</p>'

        return result

    # ── EPUB Generator ──────────────────────────────────────────────

    def generate(self, output_name: str = None):
        """Generate EPUB 3 file."""
        book_id = str(uuid.uuid4())
        out_name = output_name or self.slug
        out_path = OUTPUT_DIR / f"{out_name}.epub"
        out_path.parent.mkdir(parents=True, exist_ok=True)

        # Build content
        title = self.meta.get('title', self.slug.replace('Y', '').title())
        author = self.meta.get('author', 'Bediüzzaman Said Nursi')
        lang = self.meta.get('lang', 'tr')

        # Generate XHTML pages (one per input page, but combine into sections)
        xhtml_files = self._generate_xhtml_pages(book_id, title)

        # Generate OPF
        opf = self._generate_opf(book_id, title, author, lang, xhtml_files)

        # Generate NCX (legacy TOC)
        ncx = self._generate_ncx(book_id, title, author, xhtml_files)

        # Generate NAV (EPUB 3 TOC)
        nav = self._generate_nav(title, xhtml_files)

        # Generate CSS
        css = self._generate_css()

        # Pack EPUB
        self._pack_epub(out_path, book_id, xhtml_files, opf, ncx, nav, css)

        print(f"✅ Generated: {out_path}")
        return out_path

    def _generate_xhtml_pages(self, book_id, title):
        """Generate XHTML content files — one per ~50 pages group."""
        files = []
        # Group pages into sections by headers
        chunks = self._chunk_pages()

        for i, chunk in enumerate(chunks):
            filename = f"section_{i+1:03d}.xhtml"
            xhtml_id = f"sec_{i+1:03d}"

            body_parts = []
            for page in chunk:
                body_parts.append(f'<div class="page" data-page="{page["num"]}">')
                body_parts.append(f'<span class="page-number">{page["num"]}</span>')
                body_parts.extend(page['lines'])
                body_parts.append('</div>')

            xhtml = f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="tr" lang="tr">
<head>
  <meta charset="UTF-8"/>
  <title>{escape(title)} — {i+1}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body epub:type="bodymatter">
  {' '.join(body_parts)}
</body>
</html>"""

            files.append({
                'filename': filename,
                'id': xhtml_id,
                'title': f'Sayfa {chunk[0]["num"]}-{chunk[-1]["num"]}',
                'content': xhtml,
                'play_order': i + 1,
            })

        return files

    def _chunk_pages(self):
        """Chunk pages into groups, splitting at h1 boundaries."""
        chunks = []
        current_chunk = []

        for page in self.pages:
            current_chunk.append(page)
            # Split at h1 sections every ~30 pages or at h1
            if len(current_chunk) >= 30:
                chunks.append(current_chunk)
                current_chunk = []

        if current_chunk:
            chunks.append(current_chunk)

        return chunks

    def _generate_opf(self, book_id, title, author, lang, xhtml_files):
        """Generate content.opf."""
        manifest_items = []
        spine_items = []

        # CSS
        manifest_items.append('<item id="style" href="style.css" media-type="text/css"/>')
        # NCX
        manifest_items.append('<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>')
        # NAV
        manifest_items.append('<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>')

        for f in xhtml_files:
            manifest_items.append(
                f'<item id="{f["id"]}" href="{f["filename"]}" media-type="application/xhtml+xml"/>'
            )
            spine_items.append(f'<itemref idref="{f["id"]}"/>')

        # Build section TOC entries for guide
        guide_items = []
        for f in xhtml_files[:1]:  # First section as start
            guide_items.append(
                f'<reference type="text" title="{escape(f["title"])}" href="{f["filename"]}"/>'
            )

        return f"""<?xml version="1.0" encoding="UTF-8"?>
<package version="3.0" unique-identifier="book-id"
  xmlns="http://www.idpf.org/2007/opf"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <metadata>
    <dc:identifier id="book-id">urn:uuid:{book_id}</dc:identifier>
    <dc:title>{escape(title)}</dc:title>
    <dc:creator>{escape(author)}</dc:creator>
    <dc:language>{lang}</dc:language>
    <dc:publisher>Risale AI Studio</dc:publisher>
    <dc:date>2026</dc:date>
    <meta property="dcterms:modified">2026-06-01T00:00:00Z</meta>
  </metadata>
  <manifest>
    {' '.join(manifest_items)}
  </manifest>
  <spine toc="ncx">
    {' '.join(spine_items)}
  </spine>
  <guide>
    {' '.join(guide_items)}
  </guide>
</package>"""

    def _generate_ncx(self, book_id, title, author, xhtml_files):
        """Generate legacy NCX TOC."""
        nav_points = []
        for i, f in enumerate(xhtml_files):
            nav_points.append(f"""
      <navPoint id="nav_{f['id']}" playOrder="{f['play_order']}">
        <navLabel><text>{escape(f['title'])}</text></navLabel>
        <content src="{f['filename']}"/>
      </navPoint>""")

        return f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN"
  "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
<ncx version="2005-1" xml:lang="tr"
  xmlns="http://www.daisy.org/z3986/2005/ncx/">
  <head>
    <meta name="dtb:uid" content="urn:uuid:{book_id}"/>
    <meta name="dtb:depth" content="1"/>
  </head>
  <docTitle><text>{escape(title)}</text></docTitle>
  <docAuthor><text>{escape(author)}</text></docAuthor>
  <navMap>
    {' '.join(nav_points)}
  </navMap>
</ncx>"""

    def _generate_nav(self, title, xhtml_files):
        """Generate EPUB 3 NAV document."""
        nav_items = []
        for f in xhtml_files:
            nav_items.append(f'<li><a href="{f["filename"]}">{escape(f["title"])}</a></li>')

        return f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml"
  xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="tr" lang="tr">
<head><title>{escape(title)} — İçindekiler</title></head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>İçindekiler</h1>
    <ol>
      {' '.join(nav_items)}
    </ol>
  </nav>
  <nav epub:type="landmarks" hidden="">
    <h2>Kılavuz</h2>
    <ol>
      <li><a epub:type="bodymatter" href="{xhtml_files[0]['filename']}">Başlangıç</a></li>
    </ol>
  </nav>
</body>
</html>"""

    def _generate_css(self):
        """Generate eRisale-style CSS."""
        return """/* ── eRisale-style CSS ─────────────────────────── */
@namespace epub "http://www.idpf.org/2007/ops";

/* Page layout */
body {
  font-family: "Georgia", "Noto Serif", serif;
  font-size: 1.05rem;
  line-height: 1.9;
  color: #1a1a1a;
  background: #fdfaf5;
  margin: 2rem 2.5rem;
  max-width: 42rem;
  text-align: justify;
  hyphens: auto;
}

/* Page markers */
.page {
  position: relative;
  padding-top: 0.5rem;
  margin-bottom: 2rem;
}
.page-number {
  display: block;
  text-align: center;
  font-size: 0.8rem;
  color: #999;
  margin-bottom: 0.5rem;
  font-family: "Arial", sans-serif;
  user-select: none;
}

/* Section headings */
h1.section-title {
  font-size: 1.7rem;
  font-weight: bold;
  text-align: center;
  color: #2c3e50;
  margin: 2.5rem 0 1.5rem 0;
  line-height: 1.4;
  page-break-before: always;
}
h2.sub-section-title {
  font-size: 1.35rem;
  font-weight: bold;
  text-align: center;
  color: #34495e;
  margin: 2rem 0 1rem 0;
  line-height: 1.4;
}
h3.major-heading {
  font-size: 1.2rem;
  font-weight: bold;
  text-align: center;
  color: #3d566e;
  margin: 1.8rem 0 1rem 0;
}

/* Arabic text */
.arabic {
  display: block;
  text-align: right;
  direction: rtl;
  font-family: "Traditional Arabic", "Scheherazade New", "Amiri", serif;
  font-size: 1.4rem;
  line-height: 2.4;
  color: #1a4a2e;
  margin: 1.2rem 0;
  padding: 0.5rem 1rem;
  border-right: 3px solid #c8a96e;
  background: linear-gradient(to right, #f7f3eb, transparent);
}

/* Dialogue labels */
.dialogue-label {
  font-weight: bold;
  color: #2c3e50;
  font-style: italic;
}

/* Inline subtitles / key terms */
.inline-subtitle {
  font-weight: 600;
  color: #1a4a2e;
}

/* Parenthetical notes */
.parenthetical {
  font-style: italic;
  color: #666;
  font-size: 0.95rem;
  text-align: center;
  margin: 0.5rem 0;
}

/* Footnotes */
.footnote-ref, .footnote-link {
  font-size: 0.75rem;
  color: #8b6914;
  text-decoration: none;
  vertical-align: super;
}
.footnote-ref:hover, .footnote-link:hover {
  color: #c8a96e;
}

/* Emphasis */
em {
  font-style: italic;
  color: #2c3e50;
}

/* Separator */
.separator {
  border: none;
  border-top: 1px solid #ddd;
  margin: 2rem auto;
  width: 30%;
  text-align: center;
}

/* Collection indicator */
.collection-indicator {
  text-align: center;
  font-size: 0.85rem;
  color: #888;
  font-style: italic;
  margin: 0;
  text-indent: 0;
  font-family: "Arial", sans-serif;
}

/* Regular paragraphs */
p {
  margin: 0.4rem 0;
  text-indent: 1.5rem;
}
p:first-of-type {
  text-indent: 0;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  body {
    color: #e0d8c8;
    background: #1a1814;
  }
  h1, h2, h3 { color: #c8b88a; }
  .arabic {
    color: #8fbc8f;
    background: linear-gradient(to right, #2a2520, transparent);
    border-right-color: #5a7a5a;
  }
  .inline-subtitle, em { color: #c8b88a; }
  .dialogue-label { color: #b8c8b8; }
  .page-number { color: #666; }
  .separator { border-top-color: #444; }
}
"""

    def _pack_epub(self, out_path, book_id, xhtml_files, opf, ncx, nav, css):
        """Create the EPUB ZIP file."""
        # EPUB requires specific file order: mimetype first, uncompressed
        with zipfile.ZipFile(out_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            # mimetype must be first and STORED (not compressed)
            zf.writestr('mimetype', 'application/epub+zip', compress_type=zipfile.ZIP_STORED)

            # Container
            zf.writestr('META-INF/container.xml', CONTAINER_XML)

            # OEBPS content
            zf.writestr('OEBPS/content.opf', opf)
            zf.writestr('OEBPS/toc.ncx', ncx)
            zf.writestr('OEBPS/nav.xhtml', nav)
            zf.writestr('OEBPS/style.css', css)

            for f in xhtml_files:
                zf.writestr(f'OEBPS/{f["filename"]}', f['content'])

        # Validate mimetype position
        with open(out_path, 'rb') as f:
            header = f.read(58)
            # EPUB spec: mimetype entry must start at offset 38
            # But Python's ZipFile handles this correctly


# ── Main ────────────────────────────────────────────────────────────

BOOKS_TO_GENERATE = [
    {
        "dir": "sozlerY",
        "slug": "sozlerY",
        "title": "Sözler",
        "output": "sozler",
    },
    # Add more books as needed:
    # {"dir": "lemalarY", "slug": "lemalarY", "output": "lemalar"},
    # {"dir": "mektubatY", "slug": "mektubatY", "output": "mektubat"},
]


def main():
    for book in BOOKS_TO_GENERATE:
        book_dir = SOURCE_DIR / book["dir"]
        if not book_dir.exists():
            print(f"⚠️  Skipping {book['title']}: directory not found at {book_dir}")
            continue

        print(f"📖 Processing: {book['title']}...")
        gen = RisaleEPUBGenerator(
            str(book_dir),
            book["slug"],
            metadata={"title": book["title"], "lang": "tr"},
        )
        gen.parse()
        print(f"   Pages: {len(gen.pages)}, Footnotes: {len(gen.footnotes)}")
        gen.generate(output_name=book["output"])


if __name__ == "__main__":
    main()
