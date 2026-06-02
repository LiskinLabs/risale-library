#!/usr/bin/env python3
"""
Risale-i Nur EPUB Generator from Obsidian Markdown
Source: Obsidian Markdown (rich formatting, footnotes, inline Arabic)
Output: Premium EPUB 3 with pop-up footnotes, styled Arabic, and clean design
"""

import re
import os
import zipfile
import uuid
from pathlib import Path
from xml.sax.saxutils import escape

# ── Config ──────────────────────────────────────────────────────────
SOURCE_DIR = Path("C:/Users/silvestr.liskin/Desktop/risale_extraction/source_diyanet/obsidian-markdown")
OUTPUT_DIR = Path("C:/Users/silvestr.liskin/Desktop/risale-ai-studio/apps/readest-app/builtin-books")
PUBLIC_DIR = Path("C:/Users/silvestr.liskin/Desktop/risale-ai-studio/apps/readest-app/public/builtin-books")
MANIFEST_FILE = Path("C:/Users/silvestr.liskin/Desktop/risale-ai-studio/apps/readest-app/src/services/builtinBooks.ts")

# Full list of 15 books with Turkish titles and matching directory names
BOOKS = [
    {"dir": "01 Sözler", "filename": "sozler.epub", "title": "Sözler", "author": "Bediüzzaman Said Nursi", "group": "risale"},
    {"dir": "02 Mektubat", "filename": "mektubat.epub", "title": "Mektubat", "author": "Bediüzzaman Said Nursi", "group": "risale"},
    {"dir": "03 Lem'alar", "filename": "lemalar.epub", "title": "Lem'alar", "author": "Bediüzzaman Said Nursi", "group": "risale"},
    {"dir": "04 Şuâlar", "filename": "sualar.epub", "title": "Şuâlar", "author": "Bediüzzaman Said Nursi", "group": "risale"},
    {"dir": "05 Tarihçe-i Hayat", "filename": "tarihce-i-hayat.epub", "title": "Tarihçe-i Hayat", "author": "Bediüzzaman Said Nursi", "group": "risale"},
    {"dir": "06 Mesnevî-i Nuriye", "filename": "mesnevi-i-nuriye.epub", "title": "Mesnevî-i Nuriye", "author": "Bediüzzaman Said Nursi", "group": "risale"},
    {"dir": "07 İşaratü'l-i'caz", "filename": "isaratul-icaz.epub", "title": "İşaratü'l-i'caz", "author": "Bediüzzaman Said Nursi", "group": "risale"},
    {"dir": "08 Sikke-i Tasdik-i Gaybî", "filename": "sikke-i-tasdik-i-gaybi.epub", "title": "Sikke-i Tasdik-i Gaybî", "author": "Bediüzzaman Said Nursi", "group": "risale"},
    {"dir": "09 Barla Lâhikası", "filename": "barla-lahikasi.epub", "title": "Barla Lâhikası", "author": "Bediüzzaman Said Nursi", "group": "risale"},
    {"dir": "10 Kastamonu Lâhikası", "filename": "kastamonu-lahikasi.epub", "title": "Kastamonu Lâhikası", "author": "Bediüzzaman Said Nursi", "group": "risale"},
    {"dir": "11 Emirdağ Lâhikası 1", "filename": "emirdag-lahikasi-1.epub", "title": "Emirdağ Lâhikası 1", "author": "Bediüzzaman Said Nursi", "group": "risale"},
    {"dir": "12 Emirdağ Lâhikası 2", "filename": "emirdag-lahikasi-2.epub", "title": "Emirdağ Lâhikası 2", "author": "Bediüzzaman Said Nursi", "group": "risale"},
    {"dir": "13 Asâ-yı Musa", "filename": "asa-yi-musa.epub", "title": "Asâ-yı Musa", "author": "Bediüzzaman Said Nursi", "group": "risale"},
    {"dir": "14 Muhakemat", "filename": "muhakemat.epub", "title": "Muhakemat", "author": "Bediüzzaman Said Nursi", "group": "risale"},
    {"dir": "15 Küçük Kitaplar", "filename": "kucuk-kitaplar.epub", "title": "Küçük Kitaplar", "author": "Bediüzzaman Said Nursi", "group": "nur"},
]

CSS = r"""/* ── Premium Risale-i Nur EPUB CSS ────── */
body {
  font-family: "Georgia", "Noto Serif", "Crimson Text", serif;
  line-height: 1.85;
  text-align: justify;
  margin: 1.2rem;
  color: #2b2b2b;
}

h1 {
  font-size: 1.7rem;
  font-weight: bold;
  text-align: center;
  margin: 2.2rem 0 1.2rem;
  line-height: 1.3;
  color: #8b191b;
  page-break-before: always;
}

h2 {
  font-size: 1.45rem;
  font-weight: bold;
  text-align: center;
  margin: 1.8rem 0 0.9rem;
  line-height: 1.35;
  color: #8b191b;
}

h3 {
  font-size: 1.25rem;
  font-weight: bold;
  text-align: center;
  margin: 1.5rem 0 0.8rem;
  color: #8b191b;
}

h4 {
  font-size: 1.15rem;
  font-weight: bold;
  text-align: center;
  margin: 1.3rem 0 0.6rem;
  color: #8b191b;
}

h5 {
  font-size: 1.08rem;
  font-weight: bold;
  text-align: center;
  margin: 1.1rem 0 0.5rem;
  color: #8b191b;
}

h6 {
  font-size: 1.02rem;
  font-weight: bold;
  text-align: center;
  margin: 1rem 0 0.4rem;
  color: #8b191b;
}

/* Block-level Arabic (Quranic verses and Hadiths) */
.arabic {
  display: block;
  text-align: center;
  direction: rtl;
  font-family: "Traditional Arabic", "Scheherazade New", "Amiri", "Noto Naskh Arabic", serif;
  font-size: 1.6rem;
  line-height: 2.3;
  margin: 1.5rem 0;
  padding: 0.5rem 1rem;
  color: #8b191b;
}

/* Inline Arabic inside Turkish sentences */
.arabic-inline, span.arabic {
  direction: rtl;
  font-family: "Traditional Arabic", "Scheherazade New", "Amiri", "Noto Naskh Arabic", serif;
  font-size: 1.3rem;
  unicode-bidi: embed;
  color: #8b191b;
}

/* Sual / Elcevap / Ihtar / Elhasil block markers */
.mark-label {
  color: #8b191b;
  font-weight: bold;
  font-style: normal;
}

.sual-elcevap {
  margin: 0.8rem 0 1rem;
  text-indent: 1.5rem;
}

.sual-elcevap strong, .sual-elcevap em {
  color: #8b191b;
}

/* Blockquotes styling (inspired by eRisale premium quotes) */
blockquote, .text-blockquote {
  font-style: italic;
  margin: 1.2rem 2rem;
  padding-left: 1.2rem;
  border-left: 3px solid #8b191b;
  color: #4a4a4a;
  line-height: 1.75;
  text-indent: 0;
}

/* Separators */
.separator {
  text-align: center;
  margin: 1.5rem 0;
  font-size: 1.2rem;
  letter-spacing: 0.5rem;
  color: #8b191b;
}

p {
  margin: 0.4rem 0 0.8rem;
  text-indent: 1.5rem;
}

p.arabic, p.separator, p.sual-elcevap, p.text-blockquote, blockquote p {
  text-indent: 0;
}

/* EPUB 3 Footnotes styling (Clean book haşiye look) */
.footnote, aside[epub\:type="footnote"] {
  font-size: 0.88rem;
  line-height: 1.6;
  color: #555;
  margin-top: 1rem;
  padding: 0.6rem 0.8rem;
  background-color: #fcfaf7;
  border-left: 2px solid #8b191b;
  border-top: none;
}

.footnote p {
  margin: 0;
  text-indent: 0;
}

.footnote-backref {
  color: #8b191b;
  text-decoration: none;
  font-weight: bold;
  margin-left: 0.3rem;
}

.footnote .arabic, .footnote span.arabic {
  font-size: 1.15rem;
  line-height: 1.8;
  color: #8b191b;
}

.footnotes-container {
  margin-top: 3rem;
  border-top: 1px double #8b191b;
  padding-top: 1.5rem;
}
"""

def parse_frontmatter(content: str):
    """Parse YAML frontmatter from top of markdown files."""
    meta = {}
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n", content, re.DOTALL)
    if m:
        for line in m.group(1).split("\n"):
            if ":" in line:
                k, v = line.split(":", 1)
                meta[k.strip()] = v.strip().strip('"').strip("'")
        body = content[m.end():]
    else:
        body = content
    return meta, body

def extract_footnotes(text: str):
    """Extract footnote definitions at the bottom of markdown files."""
    lines = text.split("\n")
    body_lines = []
    footnotes = {}
    current_fn_key = None
    
    for line in lines:
        m = re.match(r"^\[\^([^\]]+)\]:\s*(.*)$", line)
        if m:
            current_fn_key = m.group(1)
            footnotes[current_fn_key] = m.group(2)
        elif current_fn_key and (line.startswith(" ") or line.startswith("\t") or not line.strip()):
            # Continue multi-line footnote
            footnotes[current_fn_key] += "\n" + line
        else:
            current_fn_key = None
            body_lines.append(line)
            
    return "\n".join(body_lines), footnotes

def is_arabic_text(text: str) -> bool:
    """Check if paragraph is primarily Arabic script."""
    if not text.strip():
        return False
    clean = re.sub(r"[\s\d.,!?;:()\[\]{}\"']+", "", text)
    if not clean:
        return False
    arabic = sum(1 for c in clean if "\u0600" <= c <= "\u06FF")
    return (arabic / len(clean)) > 0.4

def process_blockquotes(lines: list[str]) -> list[str]:
    """Pre-process markdown lines to group blockquotes (lines starting with '>') and handle Obsidian callouts."""
    processed = []
    in_quote = False
    quote_lines = []
    
    for line in lines:
        line_strip = line.strip()
        if line_strip.startswith(">"):
            in_quote = True
            # Strip the '>' and leading space
            content = re.sub(r"^>\s*", "", line_strip)
            # Handle callout syntax like [!NOTE], [!QUESTION], [!İHTAR] etc.
            m = re.match(r"^\[!([^\]]+)\]\s*(.*)$", content)
            if m:
                c_type = m.group(1).upper()
                c_title = m.group(2).strip()
                # Map standard English labels to Turkish for the book
                label_map = {
                    "NOTE": "Not",
                    "QUESTION": "Sual",
                    "WARNING": "Uyarı",
                    "TIP": "İpucu",
                    "IMPORTANT": "Önemli"
                }
                label = label_map.get(c_type, c_type.capitalize())
                if c_title:
                    content = f"<strong>{label}: {c_title}</strong>"
                else:
                    content = f"<strong>{label}:</strong>"
            quote_lines.append(content)
        else:
            if in_quote:
                # Close the blockquote
                inner_html = "<br/>".join(quote_lines)
                processed.append(f'<blockquote class="text-blockquote">{inner_html}</blockquote>')
                quote_lines = []
                in_quote = False
            processed.append(line)
            
    if in_quote:
        inner_html = "<br/>".join(quote_lines)
        processed.append(f'<blockquote class="text-blockquote">{inner_html}</blockquote>')
        
    return processed

def markdown_to_html(text: str, book_slug: str) -> tuple[str, list[dict]]:
    """Convert simple Markdown elements to XHTML, replacing footnotes and detecting Arabic blocks."""
    # 1. Extract footnotes
    body_text, footnotes_dict = extract_footnotes(text)
    
    # 2. Convert headers (with inline formatting support)
    def format_inline(text: str) -> str:
        """Apply bold, italic, and footnote refs to inline text (headings, etc.)."""
        text = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", text)
        text = re.sub(r"\*([^*]+)\*", r"<em>\1</em>", text)
        text = re.sub(r"_([^_]+)_", r"<em>\1</em>", text)
        text = re.sub(
            r"\[\^([^\]]+)\]",
            rf'<a href="#fn-{book_slug}-\1" id="fnref-{book_slug}-\1" epub:type="noteref"><sup>\1</sup></a>',
            text,
        )
        return text

    def repl_h(m):
        level = len(m.group(1))
        content = m.group(2).strip()
        # Apply inline formatting to heading content
        content = format_inline(content)
        # Create anchor ID for TOC
        anchor = f"h-{level}-{hash(content) & 0xffffff}"
        return f'<h{level} id="{anchor}">{content}</h{level}>', level, content, anchor

    headers = []
    raw_lines = body_text.split("\n")
    # Preprocess blockquotes
    lines = process_blockquotes(raw_lines)
    html_lines = []
    
    # Track headers for TOC
    for line in lines:
        line_strip = line.strip()
        if not line_strip:
            continue
            
        # Headers
        h_match = re.match(r"^(#{1,6})\s+(.*)$", line_strip)
        if h_match:
            h_html, level, title, anchor = repl_h(h_match)
            headers.append({"level": level, "title": title, "anchor": anchor})
            html_lines.append(h_html)
            continue
            
        # Separators
        if line_strip == "***" or line_strip == "---":
            html_lines.append('<p class="separator">•&ensp;•&ensp;•</p>')
            continue

        # ── Apply markdown formatting FIRST (before Arabic/layout checks) ──
        # This ensures italic/bold on lines with mixed Arabic+Latin text work.
        is_sual_elcevap = False
        if "***" in line_strip:
            # Match ***Word:*** or the typo variant ***Word:** (missing one star)
            new_line, count = re.subn(r"\*\*\*([^*]+)\*{1,3}", r'<span class="mark-label">\1</span>', line_strip)
            if count > 0:
                line_strip = new_line
                is_sual_elcevap = True

        # Format bold and italic (simple markdown regexes)
        line_strip = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", line_strip)
        line_strip = re.sub(r"\*([^*]+)\*", r"<em>\1</em>", line_strip)
        line_strip = re.sub(r"_([^_]+)_", r"<em>\1</em>", line_strip)

        # Replace footnote references [^1]
        line_strip = re.sub(
            r"\[\^([^\]]+)\]",
            rf'<a href="#fn-{book_slug}-\1" id="fnref-{book_slug}-\1" epub:type="noteref"><sup>\1</sup></a>',
            line_strip
        )

        # Check if line is block-level Arabic (starts with Arabic tag or is purely Arabic script)
        if line_strip.startswith('<p class="arabic"') or is_arabic_text(line_strip):
            # If it's already an HTML paragraph, keep as is
            if line_strip.startswith("<p"):
                html_lines.append(line_strip)
            else:
                html_lines.append(f'<p class="arabic" dir="rtl">{line_strip}</p>')
            continue

        # Wrap in appropriate paragraph
        if is_sual_elcevap:
            html_lines.append(f'<p class="sual-elcevap">{line_strip}</p>')
        elif line_strip.startswith("<p") or line_strip.startswith("<div") or line_strip.startswith("<span") or line_strip.startswith("<blockquote"):
            html_lines.append(line_strip)
        else:
            html_lines.append(f'<p>{line_strip}</p>')
            
    # Append footnotes at the bottom of the section (EPUB 3 Aside format)
    if footnotes_dict:
        html_lines.append('<div class="footnotes-container">')
        html_lines.append('<hr/>')
        for k, fn_text in footnotes_dict.items():
            # Support basic formatting in footnotes too
            fn_text = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", fn_text)
            fn_text = re.sub(r"\*([^*]+)\*", r"<em>\1</em>", fn_text)
            fn_text = re.sub(r"_([^_]+)_", r"<em>\1</em>", fn_text)
            
            # Embed Arabic tags inside footnotes if detected
            if is_arabic_text(fn_text) and not fn_text.startswith("<span"):
                fn_text = f'<span class="arabic" dir="rtl">{fn_text}</span>'
                
            html_lines.append(
                f'<aside id="fn-{book_slug}-{k}" epub:type="footnote" class="footnote">'
                f'<p><strong>[{k}]</strong> {fn_text} '
                f'<a href="#fnref-{book_slug}-{k}" class="footnote-backref">↩</a></p>'
                f'</aside>'
            )
        html_lines.append('</div>')
        
    return "\n".join(html_lines), headers

class TocEntry:
    def __init__(self, title: str, href: str, level: int, play_order: int):
        self.title = title
        self.href = href
        self.level = level
        self.play_order = play_order
        self.children: list[TocEntry] = []

class ObsidianEPUBGenerator:
    def __init__(self, book_dir: Path, title: str, author: str, book_slug: str):
        self.book_dir = Path(book_dir)
        self.title = title
        self.author = author
        self.book_slug = book_slug.replace(".epub", "")
        self.sections = []     # list of (filename, html_content)
        self.toc_entries = []  # hierarchical TOC nodes
        self._heading_counter = 0

    def parse(self):
        """Read all MD files in order, convert to XHTML."""
        files = sorted(
            [f for f in self.book_dir.glob("*.md")],
            key=lambda f: f.name,
        )

        for fpath in files:
            # Check if this is the book introduction/index
            is_intro = fpath.name.startswith("00 ")
            
            with open(fpath, "r", encoding="utf-8") as f:
                content = f.read()

            meta, body = parse_frontmatter(content)
            html_body, headers = markdown_to_html(body, self.book_slug)
            
            if not html_body.strip():
                continue
                
            self.sections.append({
                "name": fpath.stem,
                "is_intro": is_intro,
                "body": html_body,
                "headers": headers
            })

        print(f"  Parsed {len(self.sections)} markdown files.")

    def generate(self):
        """Build and package EPUB 3 zip archive."""
        book_id = str(uuid.uuid4())
        out_path = OUTPUT_DIR / f"{self.book_slug}.epub"
        out_path.parent.mkdir(parents=True, exist_ok=True)

        # Build XHTML files
        xhtml_files = []
        play_order = 1
        
        for idx, sec in enumerate(self.sections):
            filename = f"section_{idx + 1:03d}.xhtml"
            fid = f"sec_{idx + 1:03d}"
            
            # Map headers to TOC entries
            for h in sec["headers"]:
                href = f"{filename}#{h['anchor']}"
                self.toc_entries.append(
                    TocEntry(h["title"], href, h["level"], play_order)
                )
                play_order += 1

            # Wrap content in XML-compliant XHTML
            xhtml = f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml"
      xmlns:epub="http://www.idpf.org/2007/ops"
      xml:lang="tr" lang="tr">
<head>
  <meta charset="UTF-8"/>
  <title>{escape(sec['name'])}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body epub:type="bodymatter">
<!-- Section: {escape(sec['name'])} -->
{sec['body']}
</body>
</html>"""

            xhtml_files.append({
                "filename": filename,
                "id": fid,
                "title": sec["name"],
                "content": xhtml,
            })

        # Pack EPUB ZIP structure
        with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as zf:
            # 1. mimetype (MUST be first and uncompressed)
            zf.writestr("mimetype", "application/epub+zip", zipfile.ZIP_STORED)
            
            # 2. container.xml
            zf.writestr(
                "META-INF/container.xml",
                '<?xml version="1.0"?><container version="1.0" '
                'xmlns="urn:oasis:names:tc:opendocument:xmlns:container">'
                "<rootfiles>"
                '<rootfile full-path="OEBPS/content.opf" '
                'media-type="application/oebps-package+xml"/>'
                "</rootfiles></container>",
            )

            # 3. XHTML files
            for f in xhtml_files:
                zf.writestr(f"OEBPS/{f['filename']}", f["content"])

            # 4. CSS
            zf.writestr("OEBPS/style.css", CSS)
            
            # 5. Manifest content.opf
            zf.writestr("OEBPS/content.opf", self._opf(book_id, xhtml_files))
            
            # 6. TOC toc.ncx
            zf.writestr("OEBPS/toc.ncx", self._ncx(book_id))
            
            # 7. Navigation document nav.xhtml
            zf.writestr("OEBPS/nav.xhtml", self._nav())

        print(f"  Generated EPUB: {out_path.name} ({out_path.stat().st_size:,} bytes)")

        # Copy to public/ directory for web (Next.js static serving)
        import shutil
        public_path = PUBLIC_DIR / f"{self.book_slug}.epub"
        public_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(out_path, public_path)
        print(f"  → Synced to public/: {public_path.name}")

    def _opf(self, book_id, xhtml_files):
        items = [
            '<item id="style" href="style.css" media-type="text/css"/>',
            '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>',
            '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
        ]
        spine = []
        for f in xhtml_files:
            items.append(
                f'<item id="{f["id"]}" href="{f["filename"]}" media-type="application/xhtml+xml"/>'
            )
            spine.append(f'<itemref idref="{f["id"]}"/>')

        return (
            '<?xml version="1.0" encoding="UTF-8"?>'
            '<package version="3.0" unique-identifier="book-id"'
            ' xmlns="http://www.idpf.org/2007/opf"'
            ' xmlns:dc="http://purl.org/dc/elements/1.1/">'
            "<metadata>"
            f'<dc:identifier id="book-id">urn:uuid:{book_id}</dc:identifier>'
            f"<dc:title>{escape(self.title)}</dc:title>"
            f"<dc:creator>{escape(self.author)}</dc:creator>"
            "<dc:language>tr</dc:language>"
            "<dc:publisher>Risale AI Studio</dc:publisher>"
            "<dc:date>2026</dc:date>"
            '<meta property="dcterms:modified">2026-06-02T00:00:00Z</meta>'
            "</metadata>"
            "<manifest>"
            + " ".join(items)
            + "</manifest>"
            "<spine toc=\"ncx\">"
            + " ".join(spine)
            + "</spine>"
            "</package>"
        )

    def _ncx(self, book_id):
        def render_ncx(entries: list[TocEntry]) -> str:
            parts = []
            for e in entries:
                inner = render_ncx(e.children)
                parts.append(
                    f'<navPoint id="nav_{e.play_order}" playOrder="{e.play_order}">'
                    f"<navLabel><text>{escape(e.title)}</text></navLabel>"
                    f'<content src="{e.href}"/>'
                    f"{inner}"
                    "</navPoint>"
                )
            return "".join(parts)

        tree = self._build_toc_tree()
        return (
            '<?xml version="1.0" encoding="UTF-8"?>'
            '<!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" '
            '"http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">'
            '<ncx version="2005-1" xml:lang="tr"'
            ' xmlns="http://www.daisy.org/z3986/2005/ncx/">'
            f"<head><meta name=\"dtb:uid\" content=\"urn:uuid:{book_id}\"/></head>"
            f"<docTitle><text>{escape(self.title)}</text></docTitle>"
            f"<docAuthor><text>{escape(self.author)}</text></docAuthor>"
            "<navMap>"
            + render_ncx(tree)
            + "</navMap></ncx>"
        )

    def _build_toc_tree(self) -> list[TocEntry]:
        root: list[TocEntry] = []
        stack: list[TocEntry] = []

        for entry in self.toc_entries:
            while stack and stack[-1].level >= entry.level:
                stack.pop()
            if stack:
                stack[-1].children.append(entry)
            else:
                root.append(entry)
            stack.append(entry)

        return root

    def _nav(self):
        def render_nav(entries: list[TocEntry]) -> str:
            if not entries:
                return ""
            items = []
            for e in entries:
                inner = render_nav(e.children)
                items.append(
                    f'<li><a href="{e.href}">{escape(e.title)}</a>{inner}</li>'
                )
            return f"<ol>{''.join(items)}</ol>"

        tree = self._build_toc_tree()
        return (
            '<?xml version="1.0" encoding="UTF-8"?>'
            '<!DOCTYPE html>'
            '<html xmlns="http://www.w3.org/1999/xhtml"'
            ' xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="tr" lang="tr">'
            f"<head><title>{escape(self.title)} — İçindekiler</title></head>"
            "<body>"
            '<nav epub:type="toc" id="toc">'
            "<h1>İçindekiler</h1>"
            + render_nav(tree)
            + "</nav></body></html>"
        )


def update_ts_manifest():
    """Generates the src/services/builtinBooks.ts file with all 15 books."""
    manifest_entries = []
    for b in BOOKS:
        escaped_title = b["title"].replace("'", "\\'")
        escaped_author = b["author"].replace("'", "\\'")
        entry_str = f"""  {{
    filename: '{b["filename"]}',
    title: '{escaped_title}',
    author: '{escaped_author}',
    language: 'tr',
    group: '{b["group"]}',
  }},"""
        manifest_entries.append(entry_str)
        
    ts_code = f"""/**
 * Built-in Books Service
 *
 * Manages books that ship with the app (Risale-i Nur collection).
 * These books are auto-imported on first launch and cannot be deleted.
 */

import type {{ Book }} from '@/types/book';

// ── Manifest ────────────────────────────────────────────────────────

export interface BuiltinBookEntry {{
  /** File path relative to the builtin-books directory */
  filename: string;
  /** Display title in Turkish */
  title: string;
  /** Author */
  author: string;
  /** Language code */
  language: string;
  /** Group for categorization */
  group: 'risale' | 'nur';
  /** Optional: URL to fetch if not available locally */
  url?: string;
  /** Cover image filename (if available) */
  coverFilename?: string;
}}

/**
 * Built-in books manifest.
 * Automatically generated by generate_from_markdown.py.
 */
export const BUILTIN_BOOKS: BuiltinBookEntry[] = [
{chr(10).join(manifest_entries)}
];

/** URL prefix for fetching builtin books.
 * Must be an absolute URL for the book import pipeline. */
export function getBuiltinBooksBaseUrl(): string {{
  if (typeof window !== 'undefined') {{
    return `${{window.location.origin}}/builtin-books`;
  }}
  // Fallback for SSR — should be overridden via env var in production
  return process.env['NEXT_PUBLIC_BUILTIN_BOOKS_URL'] || 'http://localhost:3000/builtin-books';
}}

/** @deprecated — prefer getBuiltinBooksBaseUrl() */
export const BUILTIN_BOOKS_BASE_URL = '/builtin-books';

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Check if a book is a built-in book.
 */
export function isBuiltinBook(book: Book): boolean {{
  return book.builtin === true;
}}

/**
 * Check if a book matches a builtin entry by title.
 */
export function findBuiltinEntry(book: Book): BuiltinBookEntry | undefined {{
  return BUILTIN_BOOKS.find(
    (entry) => book.builtin && (book.title === entry.title || book.sourceTitle === entry.filename),
  );
}}
"""
    with open(MANIFEST_FILE, "w", encoding="utf-8") as f:
        f.write(ts_code)
    print(f"Updated JS/TS manifest: {MANIFEST_FILE.name}")


def main():
    print(f"Starting EPUB generation for {len(BOOKS)} books...")
    for book in BOOKS:
        book_dir = SOURCE_DIR / book["dir"]
        if not book_dir.exists():
            print(f"  [SKIP] Directory not found for {book['title']} at: {book_dir}")
            continue

        print(f"  [GEN] Processing: {book['title']}...")
        gen = ObsidianEPUBGenerator(book_dir, book["title"], book["author"], book["filename"])
        gen.parse()
        gen.generate()
        
    # Update ts file
    update_ts_manifest()
    print("EPUB import process completed successfully!")


if __name__ == "__main__":
    main()
