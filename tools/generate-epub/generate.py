#!/usr/bin/env python3
"""
Risale-i Nur EPUB Generator v2
Source: Diyanet HTML (clean, structured)
Output: EPUB 3 with eRisale-style formatting + haşiye-ready Arabic spans
"""

import re
import zipfile
import uuid
from pathlib import Path
from xml.sax.saxutils import escape

# ── Config ──────────────────────────────────────────────────────────
SOURCE_DIR = Path(
    "C:/Users/silvestr.liskin/Desktop/risale_extraction/source_diyanet/html"
)
OUTPUT_DIR = Path(__file__).resolve().parent / "output"

BOOKS = [
    {"dir": "01 Sözler", "title": "Sözler", "author": "Bedîüzzaman Said Nursî"},
]


# HTML tags/attributes allowed through from Diyanet source.
# We use a proper HTML-parser-based whitelist (not regex) for safety.
# Source is trusted official Diyanet text; this is defence-in-depth.
_ALLOWED_TAGS = {"p", "h1", "h2", "h3", "h4", "strong", "em", "br"}
_ALLOWED_ATTRS = {"class"}


def sanitize_html(html: str) -> str:
    """Strip non-whitelisted tags/attributes using a real HTML parser."""
    from html.parser import HTMLParser

    class Sanitizer(HTMLParser):
        def __init__(self):
            super().__init__()
            self.result = []
            self.skip_level = 0

        def handle_starttag(self, tag, attrs):
            if tag in ("script", "iframe", "style", "object", "embed", "applet"):
                self.skip_level += 1
                return
            if self.skip_level > 0:
                return
            if tag in _ALLOWED_TAGS:
                filtered = [
                    (k, v) for k, v in attrs
                    if k in _ALLOWED_ATTRS and "javascript" not in v.lower()
                ]
                if filtered:
                    attrs_str = "".join(
                        f' {k}="{escape(v).replace(chr(34), "&quot;")}"'
                        for k, v in filtered
                    )
                    self.result.append(f"<{tag}{attrs_str}>")
                else:
                    self.result.append(f"<{tag}>")

        def handle_endtag(self, tag):
            if tag in ("script", "iframe", "style", "object", "embed", "applet"):
                self.skip_level = max(0, self.skip_level - 1)
                return
            if self.skip_level > 0:
                return
            if tag in _ALLOWED_TAGS:
                self.result.append(f"</{tag}>")

        def handle_data(self, data):
            if self.skip_level > 0:
                return
            self.result.append(data)

        def handle_entityref(self, name):
            if self.skip_level > 0:
                return
            self.result.append(f"&{name};")

        def handle_charref(self, name):
            if self.skip_level > 0:
                return
            self.result.append(f"&#{name};")

    s = Sanitizer()
    s.feed(html)
    return "".join(s.result)


def is_arabic_text(text: str) -> bool:
    """Check if text is primarily Arabic script."""
    if not text.strip():
        return False
    clean = re.sub(r"[\s\d.,!?;:()\[\]{}\"']+", "", text)
    if not clean:
        return False
    arabic = sum(1 for c in clean if "؀" <= c <= "ۿ")
    return arabic / len(clean) > 0.5


# ── CSS ─────────────────────────────────────────────────────────────

CSS = r"""/* ── Risale-i Nur EPUB CSS (structural only) ──────
   Colors and backgrounds are left to the reader app's
   theme system (sepia, dark mode, etc.). This CSS only
   defines text structure: headings, Arabic detection,
   Sual/Elcevap blocks, and separators. */

/* ── Body ─────────────────────────────────────── */
body {
  font-family: "Georgia", "Noto Serif", "Crimson Text", serif;
  line-height: 1.95;
  text-align: justify;
  hyphens: auto;
  font-variant-ligatures: common-ligatures;
  font-kerning: normal;
}

/* ── Headings ─────────────────────────────────── */
h1 {
  font-size: 1.8rem;
  font-weight: bold;
  text-align: center;
  margin: 2.5rem 0 1.5rem;
  line-height: 1.3;
  page-break-before: always;
}
h2 {
  font-size: 1.45rem;
  font-weight: bold;
  text-align: center;
  margin: 2rem 0 1rem;
  line-height: 1.35;
}
h3 {
  font-size: 1.22rem;
  font-weight: bold;
  text-align: center;
  margin: 1.8rem 0 0.8rem;
}
h4 {
  font-size: 1.12rem;
  font-weight: bold;
  text-align: center;
  margin: 1.5rem 0 0.6rem;
}

/* ── Arabic (eRisale-style: centered, larger, no background) ── */
.arabic {
  display: block;
  text-align: center;
  direction: rtl;
  font-family: "Traditional Arabic", "Scheherazade New", "Amiri", "Noto Naskh Arabic", serif;
  font-size: 1.5rem;
  line-height: 2.5;
  margin: 1rem 0;
  padding: 0.6rem 1rem;
}
/* Inline Arabic within regular text */
.arabic-inline {
  direction: rtl;
  font-family: "Traditional Arabic", "Scheherazade New", "Amiri", serif;
  font-size: 1.2rem;
  unicode-bidi: embed;
}

/* ── Sual / Elcevap ────────────────────────────── */
.sual-elcevap {
  margin: 1rem 0;
  padding: 0.5rem 1rem;
  border-left: 3px solid;
}

/* ── Separator ─────────────────────────────────── */
.separator {
  text-align: center;
  margin: 1.5rem 0;
  font-size: 1.2rem;
  letter-spacing: 0.5rem;
  text-indent: 0;
}

/* ── Paragraphs ────────────────────────────────── */
p {
  margin: 0.4rem 0;
  text-indent: 1.5rem;
}
p:first-of-type { text-indent: 0; }
p.arabic, p.separator { text-indent: 0; }
"""


# ── EPUB Generator ───────────────────────────────────────────────────


class TocEntry:
    """A single TOC node."""
    def __init__(self, title: str, href: str, level: int, play_order: int):
        self.title = title
        self.href = href
        self.level = level
        self.play_order = play_order
        self.children: list[TocEntry] = []


class DiyanetEPUBGenerator:
    def __init__(self, book_dir: Path, title: str, author: str):
        self.book_dir = Path(book_dir)
        self.title = title
        self.author = author
        self.sections = []     # list of (filename, html_content)
        self.toc_entries = []  # list of TocEntry
        self._heading_counter = 0

    def parse(self):
        """Read all HTML files in order, extract body content."""
        files = sorted(
            [f for f in self.book_dir.glob("*.html") if not f.name.startswith("01 ")],
            key=lambda f: f.name,
        )

        for fpath in files:
            with open(fpath, "r", encoding="utf-8") as f:
                html = f.read()

            m = re.search(
                r'<div\s+class="entry-content">(.*?)</div>', html, re.DOTALL
            )
            if not m:
                continue

            body = sanitize_html(m.group(1).strip())
            if not body:
                continue
            self.sections.append((fpath.stem, body))

        print(f"  Parsed {len(self.sections)} sections")

    def _convert_body(self, body: str, section_idx: int) -> str:
        """Convert Diyanet HTML body to EPUB-ready XHTML with anchor IDs."""
        lines = body.split("\n")
        out = []

        for line in lines:
            line = line.strip()
            if not line:
                continue

            # Headings: add unique anchor ID for TOC linking
            m = re.match(r"^<h([1-4])>(.*)</h\1>$", line)
            if m:
                level = int(m.group(1))
                heading_text = m.group(2).strip()
                self._heading_counter += 1
                anchor = f"heading-{self._heading_counter}"
                # Store for TOC
                href = f"section_{section_idx + 1:03d}.xhtml#{anchor}"
                self.toc_entries.append(
                    TocEntry(heading_text, href, level, len(self.toc_entries) + 1)
                )
                out.append(
                    f'<h{level} id="{anchor}">{heading_text}</h{level}>'
                )
                continue

            # Paragraphs
            if line.startswith("<p>") and line.endswith("</p>"):
                inner = line[3:-4].strip()

                # Separator
                if inner == "***" or inner == "***":
                    out.append('<p class="separator">•&ensp;•&ensp;•</p>')
                    continue

                # Empty paragraph
                if not inner or inner == "\xa0":
                    continue

                # Arabic detection
                plain = re.sub(r"<[^>]+>", "", inner).strip()
                if is_arabic_text(plain):
                    # Block-level Arabic
                    out.append(f'<p class="arabic">{inner}</p>')
                    continue

                # Sual/Elcevap blocks
                if re.search(r"<strong><em>(Sual|Elcevap|İhtar|Elhasıl)", inner):
                    out.append(f'<p class="sual-elcevap">{inner}</p>')
                    continue

                out.append(line)
                continue

            # Pass through anything else
            out.append(line)

        return "\n".join(out)

    def generate(self, output_name: str = None):
        """Build the EPUB 3."""
        book_id = str(uuid.uuid4())
        out_name = output_name or self.title.lower().replace(" ", "-")
        out_path = OUTPUT_DIR / f"{out_name}.epub"
        out_path.parent.mkdir(parents=True, exist_ok=True)

        # Build XHTML files — one per section, chunked into groups of 20
        xhtml_files = []
        chunk_size = 20
        for chunk_idx in range(0, len(self.sections), chunk_size):
            chunk = self.sections[chunk_idx : chunk_idx + chunk_size]
            filename = f"section_{chunk_idx // chunk_size + 1:03d}.xhtml"
            fid = f"sec_{chunk_idx // chunk_size + 1:03d}"

            body_parts = []
            for sec_name, sec_body in chunk:
                sec_idx = self.sections.index((sec_name, sec_body))
                body_parts.append(
                    f'<!-- {escape(sec_name)} -->\n{self._convert_body(sec_body, sec_idx)}'
                )

            xhtml = f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml"
      xmlns:epub="http://www.idpf.org/2007/ops"
      xml:lang="tr" lang="tr">
<head>
  <meta charset="UTF-8"/>
  <title>{escape(self.title)} — {chunk_idx // chunk_size + 1}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body epub:type="bodymatter">
{chr(10).join(body_parts)}
</body>
</html>"""

            xhtml_files.append(
                {
                    "filename": filename,
                    "id": fid,
                    "title": f"{self.title} — Kısım {chunk_idx // chunk_size + 1}",
                    "content": xhtml,
                    "play_order": chunk_idx // chunk_size + 1,
                }
            )

        # Pack
        with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr("mimetype", "application/epub+zip", zipfile.ZIP_STORED)
            zf.writestr(
                "META-INF/container.xml",
                '<?xml version="1.0"?><container version="1.0" '
                'xmlns="urn:oasis:names:tc:opendocument:xmlns:container">'
                "<rootfiles>"
                '<rootfile full-path="OEBPS/content.opf" '
                'media-type="application/oebps-package+xml"/>'
                "</rootfiles></container>",
            )

            for f in xhtml_files:
                zf.writestr(f"OEBPS/{f['filename']}", f["content"])

            zf.writestr("OEBPS/style.css", CSS)
            zf.writestr("OEBPS/content.opf", self._opf(book_id, xhtml_files))
            zf.writestr("OEBPS/toc.ncx", self._ncx(book_id, xhtml_files))
            zf.writestr("OEBPS/nav.xhtml", self._nav(xhtml_files))

        print(f"  Generated: {out_path} ({out_path.stat().st_size:,}B)")

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
            '<meta property="dcterms:modified">2026-06-01T00:00:00Z</meta>'
            "</metadata>"
            "<manifest>"
            + " ".join(items)
            + "</manifest>"
            "<spine toc=\"ncx\">"
            + " ".join(spine)
            + "</spine>"
            "</package>"
        )

    def _ncx(self, book_id, _xhtml_files):
        """Build hierarchical NCX from extracted headings."""

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
        """Build hierarchical TOC from flat heading list."""
        root: list[TocEntry] = []
        stack: list[TocEntry] = []

        for entry in self.toc_entries:
            # Pop stack until we find a parent (lower or equal level)
            while stack and stack[-1].level >= entry.level:
                stack.pop()
            if stack:
                stack[-1].children.append(entry)
            else:
                root.append(entry)
            stack.append(entry)

        return root

    def _nav(self, _xhtml_files):
        """Build EPUB 3 NAV with hierarchical TOC."""

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
            f"<head><title>{escape(self.title)} — Icindekiler</title></head>"
            "<body>"
            '<nav epub:type="toc" id="toc">'
            "<h1>Icindekiler</h1>"
            + render_nav(tree)
            + "</nav></body></html>"
        )


# ── Main ────────────────────────────────────────────────────────────


def main():
    for book in BOOKS:
        book_dir = SOURCE_DIR / book["dir"]
        if not book_dir.exists():
            print(f"  SKIP {book['title']}: not found at {book_dir}")
            continue

        print(f"  Processing: {book['title']}...")
        gen = DiyanetEPUBGenerator(book_dir, book["title"], book["author"])
        gen.parse()
        gen.generate()


if __name__ == "__main__":
    main()
