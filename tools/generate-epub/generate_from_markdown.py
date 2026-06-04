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
import shutil
from pathlib import Path
from xml.sax.saxutils import escape

# ── Config ──────────────────────────────────────────────────────────
SOURCE_DIR = Path("C:/Users/silvestr.liskin/Desktop/risale_extraction/source_diyanet/obsidian-markdown")
OUTPUT_DIR = Path("C:/Users/silvestr.liskin/Desktop/risale-ai-studio/apps/readest-app/builtin-books")
PUBLIC_DIR = Path("C:/Users/silvestr.liskin/Desktop/risale-ai-studio/apps/readest-app/public/builtin-books")
MANIFEST_FILE = Path("C:/Users/silvestr.liskin/Desktop/risale-ai-studio/apps/readest-app/src/services/builtinBooks.ts")

# Full list of 15 books
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
  font-family: "ITC Souvenir", sans-serif;
}

h3 {
  font-size: 1.35rem;
  font-weight: bold;
  text-align: center;
  margin: 1.7rem 0 0.9rem;
  color: #8b191b;
  font-family: "ITC Souvenir", sans-serif;
}

h4 {
  font-size: 1.2rem;
  font-weight: bold;
  text-align: center;
  margin: 1.4rem 0 0.7rem;
  color: #8b191b;
  font-family: "ITC Souvenir", sans-serif;
}

/* Block-level Arabic (Quranic verses and Hadiths) */
.arabic {
  display: block;
  text-align: center;
  direction: rtl;
  font-family: "Nassim Arabic Pro", "Traditional Arabic", "Scheherazade New", serif;
  font-size: 1.75rem;
  line-height: 2.4;
  margin: 1.8rem 0;
  padding: 0.5rem 1rem;
  color: #8b191b;
}

/* Inline Arabic inside Turkish sentences */
.arabic-inline, span.arabic {
  direction: rtl;
  font-family: "Nassim Arabic Pro", "Traditional Arabic", serif;
  font-size: 1.4rem;
  unicode-bidi: embed;
  color: #8b191b;
}

/* Sual / Elcevap / Ihtar / Elhasil block markers */
.mark-label {
  color: #8b191b;
  font-weight: bold;
  font-style: normal;
  text-transform: uppercase;
  letter-spacing: 0.05rem;
}

.sual-elcevap {
  margin: 1rem 0 1.2rem;
  text-indent: 1.8rem;
}

/* Blockquotes styling (Premium quotes) */
blockquote, .text-blockquote {
  font-style: italic;
  margin: 1.5rem 2.5rem;
  padding-left: 1.5rem;
  border-left: 4px solid #8b191b;
  color: #444;
  line-height: 1.8;
  text-indent: 0;
}

/* Separators */
.separator {
  text-align: center;
  margin: 2.2rem 0;
  font-size: 1.5rem;
  letter-spacing: 1rem;
  color: #8b191b;
}

p {
  margin: 0.6rem 0 1.2rem;
  text-indent: 1.8rem;
}

p.arabic, p.separator, p.sual-elcevap, p.text-blockquote, blockquote p {
  text-indent: 0;
}

/* EPUB 3 Footnotes styling */
.footnote, aside[epub\:type="footnote"] {
  font-size: 0.95rem;
  line-height: 1.7;
  color: #444;
  margin-top: 1.2rem;
  padding: 0.8rem 1rem;
  background-color: #fdfaf8;
  border-left: 3px solid #8b191b;
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
  margin-left: 0.5rem;
}

.footnote .arabic, .footnote span.arabic {
  font-size: 1.15rem;
  line-height: 1.8;
  color: #8b191b;
}

.footnotes-container {
  margin-top: 3.5rem;
  border-top: 1px double #8b191b;
  padding-top: 1.8rem;
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
    """Enhanced Arabic detection for Quranic/Ottoman script."""
    if not text.strip():
        return False
    clean = re.sub(r"[\s\d.,!?;:()\[\]{}\"']+", "", text)
    if not clean:
        return False
    arabic_count = sum(1 for c in clean if "\u0600" <= c <= "\u06FF" or "\u0750" <= c <= "\u077F" or "\u08A0" <= c <= "\u08FF")
    return (arabic_count / len(clean)) > 0.4

def process_blockquotes(lines: list[str]) -> list[str]:
    """Handle callouts and blockquotes."""
    processed = []
    in_quote = False
    quote_lines = []
    
    for line in lines:
        ls = line.strip()
        if ls.startswith(">"):
            in_quote = True
            content = re.sub(r"^>\s*", "", ls)
            # Callouts
            m = re.match(r"^\[!([^\]]+)\]\s*(.*)$", content)
            if m:
                c_type = m.group(1).upper()
                c_title = m.group(2).strip()
                label_map = {"NOTE": "Not", "QUESTION": "Sual", "WARNING": "Uyarı", "TIP": "İpucu", "IMPORTANT": "Önemli"}
                label = label_map.get(c_type, c_type.capitalize())
                content = f"<strong>{label}{': ' + c_title if c_title else ''}:</strong>"
            quote_lines.append(content)
        else:
            if in_quote:
                processed.append(f'<blockquote class="text-blockquote">{"<br/>".join(quote_lines)}</blockquote>')
                quote_lines = []
                in_quote = False
            processed.append(line)
    if in_quote:
        processed.append(f'<blockquote class="text-blockquote">{"<br/>".join(quote_lines)}</blockquote>')
    return processed

def markdown_to_html(text: str, book_slug: str) -> tuple[str, list[dict]]:
    """Premium conversion with smart Arabic and marker detection."""
    body_text, footnotes_dict = extract_footnotes(text)
    
    def format_inline(t: str) -> str:
        # Detect inline Arabic (segments of 3+ Arabic chars)
        t = re.sub(r"([\u0600-\u06FF]{3,}(?:\s+[\u0600-\u06FF]{3,})*)", r'<span class="arabic-inline" dir="rtl">\1</span>', t)
        t = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", t)
        t = re.sub(r"\*([^*]+)\*", r"<em>\1</em>", t)
        t = re.sub(r"_([^_]+)_", r"<em>\1</em>", t)
        t = re.sub(r"\[\^([^\]]+)\]", rf'<a href="#fn-{book_slug}-\1" id="fnref-{book_slug}-\1" epub:type="noteref"><sup>\1</sup></a>', t)
        return t

    def repl_h(m):
        level = len(m.group(1))
        content = format_inline(m.group(2).strip())
        anchor = f"h-{level}-{hash(content) & 0xffffff}"
        return f'<h{level} id="{anchor}">{content}</h{level}>', level, content, anchor

    headers = []
    lines = process_blockquotes(body_text.split("\n"))
    html_lines = []
    
    for line in lines:
        ls = line.strip()
        if not ls: continue
            
        # 1. Headers
        h_m = re.match(r"^(#{1,6})\s+(.*)$", ls)
        if h_m:
            h_h, lvl, ttl, anc = repl_h(h_m)
            headers.append({"level": lvl, "title": ttl, "anchor": anc})
            html_lines.append(h_h)
            continue
            
        # 2. Separators
        if ls in ("***", "---", "* * *"):
            html_lines.append('<p class="separator">•&ensp;•&ensp;•</p>')
            continue

        # 3. Special Markers
        is_special = False
        markers = ["Sual:", "Elcevap:", "İhtar:", "Elhasıl:", "Fasıl:", "Nükte:"]
        for marker in markers:
            pattern = rf"^(\*\*\*)?({marker})(\*\*\*)?\s*(.*)$"
            match = re.match(pattern, ls, re.IGNORECASE)
            if match:
                html_lines.append(f'<p class="sual-elcevap"><span class="mark-label">{match.group(2)}</span> {format_inline(match.group(4))}</p>')
                is_special = True
                break
        if is_special: continue

        # 4. Arabic Blocks
        if is_arabic_text(ls):
            clean_arabic = re.sub(r"<br\s*/?>", " ", ls)
            html_lines.append(f'<p class="arabic" dir="rtl">{format_inline(clean_arabic)}</p>')
            continue

        # 5. Paragraphs
        if ls.startswith("<") or ls.startswith("&"):
            html_lines.append(ls)
        else:
            html_lines.append(f'<p>{format_inline(ls)}</p>')
            
    if footnotes_dict:
        html_lines.append('<div class="footnotes-container"><hr/>')
        for k, fn in footnotes_dict.items():
            html_lines.append(f'<aside id="fn-{book_slug}-{k}" epub:type="footnote" class="footnote"><p><strong>[{k}]</strong> {format_inline(fn)} <a href="#fnref-{book_slug}-{k}" class="footnote-backref">↩</a></p></aside>')
        html_lines.append('</div>')
        
    return "\n".join(html_lines), headers

class TocEntry:
    def __init__(self, title: str, href: str, level: int, play_order: int):
        self.title, self.href, self.level, self.play_order = title, href, level, play_order
        self.children = []

class ObsidianEPUBGenerator:
    def __init__(self, book_dir: Path, title: str, author: str, book_slug: str):
        self.book_dir, self.title, self.author = Path(book_dir), title, author
        self.book_slug = book_slug.replace(".epub", "")
        self.sections, self.toc_entries = [], []

    def parse(self):
        files = sorted([f for f in self.book_dir.glob("*.md")], key=lambda f: f.name)
        for fpath in files:
            is_intro = fpath.name.startswith("00 ")
            with open(fpath, "r", encoding="utf-8") as f:
                content = f.read()
            meta, body = parse_frontmatter(content)
            html_body, headers = markdown_to_html(body, self.book_slug)
            if html_body.strip():
                self.sections.append({"name": fpath.stem, "is_intro": is_intro, "body": html_body, "headers": headers})
        print(f"  Parsed {len(self.sections)} markdown files.")

    def generate(self):
        book_id = str(uuid.uuid4())
        out_path = OUTPUT_DIR / f"{self.book_slug}.epub"
        out_path.parent.mkdir(parents=True, exist_ok=True)
        xhtml_files, play_order = [], 1
        
        for idx, sec in enumerate(self.sections):
            filename = f"section_{idx + 1:03d}.xhtml"
            for h in sec["headers"]:
                self.toc_entries.append(TocEntry(h["title"], f"{filename}#{h['anchor']}", h["level"], play_order))
                play_order += 1
            xhtml = f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="tr" lang="tr">
<head><meta charset="UTF-8"/><title>{escape(sec['name'])}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body epub:type="bodymatter"><!-- Section: {escape(sec['name'])} -->{sec['body']}</body></html>"""
            xhtml_files.append({"filename": filename, "id": f"sec_{idx + 1:03d}", "content": xhtml})

        with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr("mimetype", "application/epub+zip", zipfile.ZIP_STORED)
            zf.writestr("META-INF/container.xml", '<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>')
            for f in xhtml_files: zf.writestr(f"OEBPS/{f['filename']}", f["content"])
            zf.writestr("OEBPS/style.css", CSS)
            zf.writestr("OEBPS/content.opf", self._opf(book_id, xhtml_files))
            zf.writestr("OEBPS/toc.ncx", self._ncx(book_id))
            zf.writestr("OEBPS/nav.xhtml", self._nav())
        print(f"  Generated EPUB: {out_path.name}")
        public_path = PUBLIC_DIR / f"{self.book_slug}.epub"
        public_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(out_path, public_path)

    def _opf(self, book_id, xhtml_files):
        items = ['<item id="style" href="style.css" media-type="text/css"/>', '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>', '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>']
        spine = []
        for f in xhtml_files:
            items.append(f'<item id="{f["id"]}" href="{f["filename"]}" media-type="application/xhtml+xml"/>')
            spine.append(f'<itemref idref="{f["id"]}"/>')
        return f'<?xml version="1.0" encoding="UTF-8"?><package version="3.0" unique-identifier="book-id" xmlns="http://www.idpf.org/2007/opf" xmlns:dc="http://purl.org/dc/elements/1.1/"><metadata><dc:identifier id="book-id">urn:uuid:{book_id}</dc:identifier><dc:title>{escape(self.title)}</dc:title><dc:creator>{escape(self.author)}</dc:creator><dc:language>tr</dc:language><dc:publisher>Risale AI Studio</dc:publisher><dc:date>2026</dc:date><meta property="dcterms:modified">2026-06-04T00:00:00Z</meta></metadata><manifest>{" ".join(items)}</manifest><spine toc="ncx">{" ".join(spine)}</spine></package>'

    def _ncx(self, book_id):
        def render_ncx(entries):
            return "".join([f'<navPoint id="nav_{e.play_order}" playOrder="{e.play_order}"><navLabel><text>{escape(e.title)}</text></navLabel><content src="{e.href}"/>{render_ncx(e.children)}</navPoint>' for e in entries])
        return f'<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd"><ncx version="2005-1" xml:lang="tr" xmlns="http://www.daisy.org/z3986/2005/ncx/"><head><meta name="dtb:uid" content="urn:uuid:{book_id}"/></head><docTitle><text>{escape(self.title)}</text></docTitle><docAuthor><text>{escape(self.author)}</text></docAuthor><navMap>{render_ncx(self._build_toc_tree())}</navMap></ncx>'

    def _build_toc_tree(self):
        root, stack = [], []
        for e in self.toc_entries:
            while stack and stack[-1].level >= e.level: stack.pop()
            if stack: stack[-1].children.append(e)
            else: root.append(e)
            stack.append(e)
        return root

    def _nav(self):
        def render_nav(entries):
            return f"<ol>{''.join([f'<li><a href=\"{e.href}\">{escape(e.title)}</a>{render_nav(e.children)}</li>' for e in entries])}</ol>" if entries else ""
        return f'<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="tr" lang="tr"><head><title>{escape(self.title)} — İçindekiler</title></head><body><nav epub:type="toc" id="toc"><h1>İçindekiler</h1>{render_nav(self._build_toc_tree())}</nav></body></html>'

def update_ts_manifest():
    entries = [f"  {{ filename: '{b['filename']}', title: '{b['title'].replace(\"'\", \"\\\\'\")}', author: '{b['author'].replace(\"'\", \"\\\\'\")}', language: 'tr', group: '{b['group']}' }}," for b in BOOKS]
    ts_code = f"import type {{ Book }} from '@/types/book';\nexport interface BuiltinBookEntry {{ filename: string; title: string; author: string; language: string; group: 'risale' | 'nur'; url?: string; coverFilename?: string; }}\nexport const BUILTIN_BOOKS: BuiltinBookEntry[] = [\n{chr(10).join(entries)}\n];\nexport function getBuiltinBooksBaseUrl(): string {{ if (typeof window !== 'undefined') return `${{window.location.origin}}/builtin-books`; return process.env['NEXT_PUBLIC_BUILTIN_BOOKS_URL'] || 'http://localhost:3000/builtin-books'; }}\nexport const BUILTIN_BOOKS_BASE_URL = '/builtin-books';\nexport function isBuiltinBook(book: Book): boolean {{ return book.builtin === true; }}\nexport function findBuiltinEntry(book: Book): BuiltinBookEntry | undefined {{ return BUILTIN_BOOKS.find((entry) => book.builtin && (book.title === entry.title || book.sourceTitle === entry.filename)); }}\n"
    with open(MANIFEST_FILE, "w", encoding="utf-8") as f: f.write(ts_code)

def main():
    for book in BOOKS:
        book_dir = SOURCE_DIR / book["dir"]
        if not book_dir.exists(): continue
        gen = ObsidianEPUBGenerator(book_dir, book["title"], book["author"], book["filename"])
        gen.parse(); gen.generate()
    update_ts_manifest()

if __name__ == "__main__": main()
