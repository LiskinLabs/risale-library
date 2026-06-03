import zipfile
import os

epub_path = r'C:\Users\silvestr.liskin\Desktop\risale-ai-studio\apps\readest-app\public\builtin-books\ru-kucuk-sozler-parallel.epub'
chapters_dir = r'C:\Users\silvestr.liskin\Desktop\risale-ai-studio\data\sync\chapters'

def create_epub():
    with zipfile.ZipFile(epub_path, 'w') as zipf:
        # EPUB requires 'mimetype' to be first and uncompressed
        zipf.writestr('mimetype', 'application/epub+zip', compress_type=zipfile.ZIP_STORED)
        
        # Container
        container_xml = '<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>'
        zipf.writestr('META-INF/container.xml', container_xml)
        
        # Simple OPF (just enough for our reader)
        opf = """<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>Малые Слова (Параллельный перевод)</dc:title>
    <dc:creator>Бадиуззаман Саид Нурси</dc:creator>
    <dc:language>ru</dc:language>
    <dc:identifier id="bookid">ru-kucuk-sozler-parallel</dc:identifier>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
"""
        spine = '<spine toc="ncx">'
        
        files = sorted(os.listdir(chapters_dir), key=lambda x: int(x.replace('chapter', '').replace('.md', '')))
        
        for i, f in enumerate(files):
            item_id = f"chap{i+1}"
            opf += f'    <item id="{item_id}" href="{f}" media-type="text/markdown"/>\n'
            spine += f'\n    <itemref idref="{item_id}"/>'
            zipf.write(os.path.join(chapters_dir, f), 'OEBPS/' + f)
            
        opf += '  </manifest>\n' + spine + '\n  </spine>\n</package>'
        zipf.writestr('OEBPS/content.opf', opf)
        
        # Simple NCX
        ncx = '<?xml version="1.0" encoding="UTF-8"?><ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><head><meta name="dtb:uid" content="ru-kucuk-sozler-parallel"/></head><docTitle><text>Table of Contents</text></docTitle><navMap>'
        for i, f in enumerate(files):
            ncx += f'<navPoint id="navPoint-{i+1}" playOrder="{i+1}"><navLabel><text>Chapter {i+1}</text></navLabel><content src="{f}"/></navPoint>'
        ncx += '</navMap></ncx>'
        zipf.writestr('OEBPS/toc.ncx', ncx)

if __name__ == '__main__':
    create_epub()
    print(f"Generated: {epub_path}")
