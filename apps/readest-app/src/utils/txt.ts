import { partialMD5 } from './md5';
import { getBaseFilename } from './path';
import { configureZip } from './zip';

interface Metadata {
  bookTitle: string;
  author: string;
  language: string;
  identifier: string;
}

interface Chapter {
  title: string;
  content: string;
  isVolume: boolean;
}

interface Txt2EpubOptions {
  file: File;
  author?: string;
  language?: string;
  index?: Array<{ title: string; page: string }>;
}

interface ExtractChapterOptions {
  linesBetweenSegments: number;
  fallbackParagraphsPerChapter: number;
  index?: Array<{ title: string; page: string }>;
}

export interface ConversionResult {
  file: File;
  bookTitle: string;
  chapterCount: number;
  language: string;
}

const zipWriteOptions = {
  lastAccessDate: new Date(0),
  lastModDate: new Date(0),
};

const escapeXml = (str: string) => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

export class TxtToEpubConverter {
  public async convert(options: Txt2EpubOptions): Promise<ConversionResult> {
    return await this.convertSmallFile(options);
  }

  private async convertSmallFile(options: Txt2EpubOptions): Promise<ConversionResult> {
    const { file: txtFile, index: providedIndex } = options;
    const fileContent = await txtFile.arrayBuffer();
    const decoder = new TextDecoder('utf-8');
    let txtContent = decoder.decode(fileContent).trim();

    // Clean frontmatter
    txtContent = txtContent.replace(/^---[\s\S]*?\n---/g, '').trim();

    const bookTitle = this.extractBookTitle(getBaseFilename(txtFile.name));
    const author = options.author || 'Bediüzzaman Said Nursi';
    const language = options.language || 'ru';
    const identifier = await partialMD5(txtFile);
    const metadata = { bookTitle, author, language, identifier };

    const chapters = this.extractChapters(
      txtContent,
      {
        linesBetweenSegments: 8,
        fallbackParagraphsPerChapter: 100,
        index: providedIndex,
      },
      metadata,
    );

    const blob = await this.createEpub(chapters, metadata);
    return {
      file: new File([blob], `${bookTitle}.epub`),
      bookTitle,
      chapterCount: chapters.length,
      language,
    };
  }

  private extractChapters(
    txtContent: string,
    option: ExtractChapterOptions,
    metadata: Metadata,
  ): Chapter[] {
    const { linesBetweenSegments, index } = option;
    const segmentRegex = new RegExp(`(?:\\r?\\n){${linesBetweenSegments},}|-{8,}\r?\n`);
    const chapters: Chapter[] = [];
    const segments = txtContent.split(segmentRegex);

    for (const segment of segments) {
      const segmentChapters = this.extractChaptersFromSegment(segment, metadata);
      chapters.push(...segmentChapters);
    }

    if (index && index.length > 0) {
      for (let i = 0; i < chapters.length && i < index.length; i++) {
        chapters[i]!.title = index[i]!.title.replace(/@.*$/, '')
          .replace(/[#<>]+/g, '')
          .trim();
      }
    }
    return chapters;
  }

  /** Internal API for tests */
  private createChapterRegexps(language: string): RegExp[] {
    if (language === 'zh') {
      return [
        /^第[0-9一二三四五六七八九十百零〇\s]+[章节回讲篇封本册部话].*$/iu,
        /^(楔子|前言|简介|引言|序言|序章|总论|概论|后记).*$/iu,
      ];
    }
    return [
      /^(Chapter|Section|Part|Book|Volume|Act|Prologue|Epilogue|Introduction|Foreword|Preface|Afterword)\s*[\d.VXLCM]*/i,
      /^#{1,3}\s+/m,
    ];
  }

  private extractChaptersFromSegment(segment: string, metadata: Metadata): Chapter[] {
    // Preserve page markers
    let processed = segment.replace(/<!--\s*Page\s*(\d+)\s*-->/gi, '[[PAGE_$1]]');
    processed = processed.replace(/<!--[\s\S]*?-->/g, '');

    const lines = processed
      .split(/\n+/)
      .map((l) => l.trim())
      .filter((l) => l);
    if (lines.length === 0) return [];

    const risaleRegexps = [/^#{1,3}\s+/m, /^<(?!div).*?>$/m];
    const genericRegexps = this.createChapterRegexps(metadata.language);
    const chapterRegexps = [...risaleRegexps, ...genericRegexps];

    const segmentChapters: Chapter[] = [];
    let currentContent: string[] = [];
    let currentTitle = '';

    for (const line of lines) {
      let isHeader = false;
      for (const rx of chapterRegexps) {
        if (rx.test(line)) {
          if (currentContent.length > 0 || currentTitle) {
            segmentChapters.push({
              title: currentTitle || '...',
              content: this.formatLines(currentContent),
              isVolume:
                line.includes('卷') ||
                line.includes('部') ||
                line.includes('册') ||
                line.includes('本'),
            });
          }
          currentTitle = line.replace(/[#<>]+/g, '').trim();
          currentContent = [];
          isHeader = true;
          break;
        }
      }
      if (!isHeader) currentContent.push(line);
    }

    if (currentContent.length > 0 || currentTitle) {
      segmentChapters.push({
        title: currentTitle || '...',
        content: this.formatLines(currentContent),
        isVolume: false,
      });
    }

    return segmentChapters;
  }

  private formatLines(lines: string[]): string {
    const htmlLines: string[] = [];
    let inArabic = false;
    let arabicBuffer: string[] = [];

    for (let line of lines) {
      // Skip already formatted HTML blocks
      if (
        line.trim().startsWith('<div class="arabic-block"') ||
        line.trim().startsWith('<div class="risale-page-marker"') ||
        line.trim().startsWith('<div class="risale-subtitle"') ||
        line.trim().startsWith('<div class="translated-quote"')
      ) {
        htmlLines.push(line);
        continue;
      }

      // Page markers
      line = line.replace(/\[\[PAGE_(\d+)\]\]/g, '<div class="risale-page-marker">стр. $1</div>');

      // Bold/Italic (Markdown)
      line = line.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      line = line.replace(/\*(.*?)\*/g, '<em>$1</em>');

      // Arabic block (legacy > support)
      if (line.startsWith('>')) {
        inArabic = true;
        arabicBuffer.push(line.slice(1).trim());
        continue;
      }

      if (inArabic) {
        htmlLines.push(
          `<div class="arabic-block" dir="rtl">${escapeXml(arabicBuffer.join(' '))}</div>`,
        );
        arabicBuffer = [];
        inArabic = false;
      }

      // Specific Risale layout
      if (line.startsWith('<') && line.endsWith('>')) {
        htmlLines.push(`<h2 class="centered-title">${escapeXml(line.slice(1, -1).trim())}</h2>`);
      } else if (line.startsWith('[') && line.endsWith(']')) {
        htmlLines.push(
          `<p class="centered-note"><em>${escapeXml(line.slice(1, -1).trim())}</em></p>`,
        );
      } else if (
        line.length < 120 &&
        (line.includes('(Саид Нурси)') ||
          line.includes('Вечен') ||
          (line.startsWith('(') && line.endsWith(')')))
      ) {
        htmlLines.push(`<div class="right-aligned">${escapeXml(line)}</div>`);
      } else if (line.includes('class="risale-page-marker"')) {
        htmlLines.push(line);
      } else if (line.startsWith('## ')) {
        htmlLines.push(`<h2>${escapeXml(line.slice(3).trim())}</h2>`);
      } else if (line.startsWith('# ')) {
        htmlLines.push(`<h1>${escapeXml(line.slice(2).trim())}</h1>`);
      } else {
        htmlLines.push(`<p>${escapeXml(line)}</p>`);
      }
    }

    if (inArabic) {
      htmlLines.push(
        `<div class="arabic-block" dir="rtl">${escapeXml(arabicBuffer.join(' '))}</div>`,
      );
    }

    return htmlLines.join('\n');
  }

  private extractBookTitle(filename: string): string {
    return filename.split('.')[0]!;
  }

  private async createEpub(chapters: Chapter[], metadata: Metadata): Promise<Blob> {
    await configureZip();
    const { BlobWriter, TextReader, ZipWriter } = await import('@zip.js/zip.js');
    const zipWriter = new ZipWriter(new BlobWriter('application/epub+zip'), {
      extendedTimestamp: false,
    });

    await zipWriter.add('mimetype', new TextReader('application/epub+zip'), zipWriteOptions);
    await zipWriter.add(
      'META-INF/container.xml',
      new TextReader(
        `<?xml version="1.0" encoding="UTF-8"?><container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0"><rootfiles><rootfile full-path="content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`,
      ),
      zipWriteOptions,
    );

    const navPoints = chapters
      .map(
        (c, i) =>
          `<navPoint id="cp${i + 1}" playOrder="${i + 1}"><navLabel><text>${escapeXml(c.title)}</text></navLabel><content src="OEBPS/ch${i + 1}.xhtml"/></navPoint>`,
      )
      .join('\n');
    const tocNcx = `<?xml version="1.0" encoding="UTF-8"?><ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><head><meta name="dtb:uid" content="${metadata.identifier}"/></head><docTitle><text>${escapeXml(metadata.bookTitle)}</text></docTitle><navMap>${navPoints}</navMap></ncx>`;
    await zipWriter.add('toc.ncx', new TextReader(tocNcx), zipWriteOptions);

    const manifest = chapters
      .map(
        (_, i) =>
          `<item id="ch${i + 1}" href="OEBPS/ch${i + 1}.xhtml" media-type="application/xhtml+xml"/>`,
      )
      .join('\n');
    const spine = chapters.map((_, i) => `<itemref idref="ch${i + 1}"/>`).join('\n');
    const contentOpf = `<?xml version="1.0" encoding="UTF-8"?><package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="bid"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${escapeXml(metadata.bookTitle)}</dc:title><dc:language>${metadata.language}</dc:language><dc:creator>${escapeXml(metadata.author)}</dc:creator><dc:identifier id="bid">${metadata.identifier}</dc:identifier></metadata><manifest>${manifest}<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/><item id="css" href="style.css" media-type="text/css"/></manifest><spine toc="ncx">${spine}</spine></package>`;
    await zipWriter.add('content.opf', new TextReader(contentOpf), zipWriteOptions);

    const css = `body { font-family: sans-serif; text-align: justify; line-height: 1.6; padding: 5%; } .centered-title { text-align: center; margin: 1em 0; font-weight: bold; } .arabic-block { text-align: center; color: #b03030; direction: rtl; font-size: 1.4em; margin: 1em 0; } .right-aligned { text-align: right; font-style: italic; margin: 0.5em 0; } .centered-note { text-align: center; font-size: 0.9em; opacity: 0.8; } .risale-page-marker { text-align: right; font-size: 0.8em; opacity: 0.5; border-bottom: 1px solid #ccc; margin: 1em 0; }`;
    await zipWriter.add('style.css', new TextReader(css), zipWriteOptions);

    for (let i = 0; i < chapters.length; i++) {
      const xhtml = `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml"><head><title>${escapeXml(chapters[i]!.title)}</title><link rel="stylesheet" type="text/css" href="../style.css"/></head><body>${chapters[i]!.content}</body></html>`;
      await zipWriter.add(`OEBPS/ch${i + 1}.xhtml`, new TextReader(xhtml), zipWriteOptions);
    }

    return await zipWriter.close();
  }
}
