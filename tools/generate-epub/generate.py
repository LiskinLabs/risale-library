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

CSS = r"""/* ── Risale-i Nur EPUB CSS v2 (structural-only) ──────
   Colors and backgrounds are left to the reader app's
   theme system (sepia, dark mode, etc.). This CSS only
   defines text structure, typography, and semantic blocks.
   Compatible with EPUB 3.3 + EPUB 3.4 (Annotations). */

/* ── Body ─────────────────────────────────────── */
body {
  font-family: "Georgia", "Noto Serif", "Crimson Text", "Linux Libertine", serif;
  line-height: 1.95;
  text-align: justify;
  hyphens: auto;
  -webkit-hyphens: auto;
  font-variant-ligatures: common-ligatures discretionary-ligatures;
  font-kerning: normal;
  font-variant-numeric: oldstyle-nums;
  orphans: 2;
  widows: 2;
}

/* ── Headings ─────────────────────────────────── */
h1 {
  font-size: 1.8rem;
  font-weight: 700;
  text-align: center;
  margin: 2.5rem 0 1.5rem;
  line-height: 1.3;
  page-break-before: always;
  letter-spacing: -0.02em;
}
h2 {
  font-size: 1.45rem;
  font-weight: 700;
  text-align: center;
  margin: 2rem 0 1rem;
  line-height: 1.35;
  letter-spacing: -0.01em;
}
h3 {
  font-size: 1.22rem;
  font-weight: 700;
  text-align: center;
  margin: 1.8rem 0 0.8rem;
}
h4 {
  font-size: 1.12rem;
  font-weight: 600;
  text-align: center;
  margin: 1.5rem 0 0.6rem;
}

/* ── Basmala (﷽) ───────────────────────────────── */
.basmala {
  display: block;
  text-align: center;
  direction: rtl;
  font-family: "Scheherazade New", "Traditional Arabic", "Amiri",
               "Noto Naskh Arabic", serif;
  font-size: 2rem;
  line-height: 2.5;
  margin: 1.5rem 0 2rem;
}

/* ── Arabic (block-level aya) ───────────────────── */
.arabic {
  display: block;
  text-align: center;
  direction: rtl;
  unicode-bidi: embed;
  font-family: "Scheherazade New", "Traditional Arabic", "Amiri",
               "Noto Naskh Arabic", serif;
  font-size: 1.5rem;
  line-height: 2.5;
  margin: 1.2rem 0;
  padding: 0.8rem 1.5rem;
  border-top: 1px solid rgba(128,128,128,0.15);
  border-bottom: 1px solid rgba(128,128,128,0.15);
}
/* Aya with tashkeel (diacritics) — extra line-height */
.arabic.tashkeel {
  line-height: 3;
  font-size: 1.6rem;
}
/* Aya reference (sura:aya) below the Arabic text */
.arabic .ayat-ref {
  display: block;
  text-align: center;
  direction: ltr;
  font-size: 0.75rem;
  opacity: 0.65;
  margin-top: 0.5rem;
  font-family: "Georgia", serif;
}

/* ── Inline Arabic (within Turkish/Russian text) ── */
.arabic-inline {
  direction: rtl;
  unicode-bidi: embed;
  font-family: "Scheherazade New", "Traditional Arabic", "Amiri", serif;
  font-size: 1.2em;
  vertical-align: baseline;
}

/* ── Hadith (distinguished from aya) ─────────────── */
.hadith {
  display: block;
  text-align: center;
  direction: rtl;
  unicode-bidi: embed;
  font-family: "Traditional Arabic", "Amiri", "Noto Naskh Arabic", serif;
  font-size: 1.2rem;
  line-height: 2.2;
  margin: 1rem 0;
  font-style: italic;
}

/* ── Group of consecutive ayas ──────────────────── */
.ayat-group {
  display: block;
  margin: 1.5rem 0;
  padding: 1rem;
  text-align: center;
}
.ayat-group .arabic {
  border-top: none;
  border-bottom: none;
  margin: 0.5rem 0;
}

/* ── Sual (Question) ────────────────────────────── */
.risale-sual {
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 0;
  text-indent: 0;
}

/* ── Elcevap (Answer) ───────────────────────────── */
.risale-elcevap {
  margin-top: 0.3rem;
  margin-bottom: 1.5rem;
}

/* ── Sual/Elcevap combined block ────────────────── */
.sual-elcevap {
  margin: 1rem 0;
  padding: 0.6rem 1.2rem;
  border-left: 3px solid rgba(128,128,128,0.3);
}

/* ── Ihtar (Warning/Important Note) ─────────────── */
.risale-ihtar {
  margin: 1.2rem 1rem;
  padding: 0.8rem 1.2rem;
  border: 1px solid rgba(128,128,128,0.25);
  border-radius: 4px;
  font-size: 0.95rem;
  font-style: italic;
}

/* ── Haşiye block (embedded commentary) ─────────── */
.risale-hasiye-block {
  margin: 0.5rem 2rem 1rem;
  padding: 0.6rem 1rem;
  font-size: 0.9rem;
  opacity: 0.85;
  border-left: 2px solid rgba(128,128,128,0.2);
}

/* ── Preface (author's introduction) ─────────────── */
.risale-preface {
  font-style: italic;
  margin: 2rem 1.5rem;
  padding: 0.8rem 1.2rem;
  border-left: 3px solid rgba(128,128,128,0.3);
  opacity: 0.9;
}

/* ── Separator ─────────────────────────────────── */
.separator {
  text-align: center;
  margin: 1.5rem 0;
  font-size: 1.2rem;
  letter-spacing: 0.5rem;
  text-indent: 0;
  user-select: none;
}

/* ── Page marker (reference to original print page) ── */
.page-marker {
  display: inline;
  font-size: 0.75rem;
  vertical-align: super;
  opacity: 0.5;
  user-select: none;
}

/* ── Paragraphs ────────────────────────────────── */
p {
  margin: 0.4rem 0;
  text-indent: 1.5rem;
}
p:first-of-type { text-indent: 0; }
p.arabic, p.separator, p.basmala, p.risale-sual,
p.risale-ihtar, p.risale-hasiye-block { text-indent: 0; }

/* ── Emphasis ──────────────────────────────────── */
strong { font-weight: 700; }
em { font-style: italic; }

/* ── Responsive (mobile readers) ───────────────── */
@media (max-width: 480px) {
  body { font-size: 16px; line-height: 1.8; }
  .arabic {
    font-size: 1.25rem;
    padding: 0.5rem 0.8rem;
    line-height: 2.2;
  }
  .basmala { font-size: 1.6rem; }
  .sual-elcevap { margin: 0.8rem 0; padding: 0.4rem 0.6rem; }
  h1 { font-size: 1.5rem; }
  h2 { font-size: 1.25rem; }
}
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
        """Convert Diyanet HTML body to EPUB-ready XHTML with anchor IDs.

        Semantic detection (in priority order):
        1. Headings (h1-h4) → anchor IDs for TOC
        2. Basmala (﷽ or Bismillah...) → .basmala
        3. Separators (***) → .separator
        4. Arabic text → .arabic (block-level aya)
        5. Hadith (Arabic but shorter, italic style) → .hadith
        6. Sual → .risale-sual
        7. Elcevap → .risale-elcevap
        8. Ihtar/Elhasıl → .risale-ihtar
        9. Sual/Elcevap combined → .sual-elcevap (fallback)
        """
        lines = body.split("\n")
        out = []
        _prev_was_sual = False

        for line in lines:
            line = line.strip()
            if not line:
                continue

            # ── Headings ────────────────────────────────
            m = re.match(r"^<h([1-4])>(.*)</h\1>$", line)
            if m:
                level = int(m.group(1))
                heading_text = m.group(2).strip()
                self._heading_counter += 1
                anchor = f"heading-{self._heading_counter}"
                href = f"section_{section_idx + 1:03d}.xhtml#{anchor}"
                self.toc_entries.append(
                    TocEntry(heading_text, href, level, len(self.toc_entries) + 1)
                )
                out.append(
                    f'<h{level} id="{anchor}">{heading_text}</h{level}>'
                )
                continue

            if not (line.startswith("<p>") and line.endswith("</p>")):
                out.append(line)
                continue

            inner = line[3:-4].strip()

            # ── Separator ──────────────────────────────
            if inner in ("***", "***", "---", "---"):
                out.append('<p class="separator">•&ensp;•&ensp;•</p>')
                _prev_was_sual = False
                continue

            # ── Empty paragraph ─────────────────────────
            if not inner or inner == "\xa0":
                _prev_was_sual = False
                continue

            plain = re.sub(r"<[^>]+>", "", inner).strip()

            # ── Basmala detection ───────────────────────
            if re.search(r"[﷽☫]", plain) or plain.strip().startswith(
                "Bismill"
            ):
                out.append(f'<p class="basmala">{inner}</p>')
                _prev_was_sual = False
                continue

            # ── Arabic text ─────────────────────────────
            if is_arabic_text(plain):
                # Check if it's a hadith (shorter, often in quotes)
                if len(plain) < 100 and (
                    "hadîs" in plain.lower()
                    or "hadis" in plain.lower()
                    or "rivayet" in plain.lower()
                ):
                    out.append(f'<p class="hadith">{inner}</p>')
                else:
                    out.append(f'<p class="arabic">{inner}</p>')
                _prev_was_sual = False
                continue

            # ── Sual (Question) ─────────────────────────
            if re.match(
                r"^(?:<strong>)?\s*(?:<em>)?\s*Sual[\s:]", inner
            ):
                out.append(f'<p class="risale-sual">{inner}</p>')
                _prev_was_sual = True
                continue

            # ── Elcevap (Answer) ────────────────────────
            if re.match(
                r"^(?:<strong>)?\s*(?:<em>)?\s*Elcevap[\s:]", inner
            ):
                if _prev_was_sual:
                    out.append(f'<p class="risale-elcevap">{inner}</p>')
                else:
                    out.append(f'<p class="sual-elcevap">{inner}</p>')
                _prev_was_sual = False
                continue

            # ── İhtar / Elhasıl (Warning/Summary) ────────
            if re.match(
                r"^(?:<strong>)?\s*(?:<em>)?\s*(?:İhtar|Elhasıl)[\s:]", inner
            ):
                out.append(f'<p class="risale-ihtar">{inner}</p>')
                _prev_was_sual = False
                continue

            # ── Fallback Sual/Elcevap (combined) ────────
            if re.search(
                r"<strong><em>(?:Sual|Elcevap|İhtar|Elhasıl)", inner
            ):
                out.append(f'<p class="sual-elcevap">{inner}</p>')
                _prev_was_sual = False
                continue

            # ── Regular paragraph ────────────────────────
            out.append(line)
            _prev_was_sual = False

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
            '<package version="3.3" unique-identifier="book-id"'
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
