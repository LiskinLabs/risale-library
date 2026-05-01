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
    const language = options.language || 'ru';
    const identifier = await partialMD5(options.file);
    const bookTitle = this.extractBookTitle(getBaseFilename(options.file.name));
    const metadata = {
      bookTitle,
      author: options.author || 'Bediüzzaman Said Nursi',
      language,
      identifier,
    };

    if (options.file.size > 5 * 1024 * 1024) {
      const encoding = await this.detectEncodingFromFile(options.file);
      let lines = 8;
      const baseOption = { linesBetweenSegments: lines, fallbackParagraphsPerChapter: 100 };
      const count = await this.probeChapterCountFromFileBySegments(
        options.file,
        encoding,
        metadata,
        baseOption,
      );

      if (count < 2) {
        const c7 = await this.probeChapterCountFromFileBySegments(
          options.file,
          encoding,
          metadata,
          {
            ...baseOption,
            linesBetweenSegments: 7,
          },
        );
        lines = c7 < 2 ? 6 : 7;
      } else {
        lines = 7;
      }

      const finalOption = { ...baseOption, linesBetweenSegments: lines };
      const chapters = await this.extractChaptersFromFileBySegments(
        options.file,
        encoding,
        metadata,
        finalOption,
      );

      if (chapters.length === 0) throw new Error('No chapters detected');

      const blob = await this.createEpub(chapters, metadata);
      return {
        file: new File([blob], `${bookTitle}.epub`),
        bookTitle,
        chapterCount: chapters.length,
        language,
      };
    }

    const fileContent = await options.file.arrayBuffer();
    const decoder = new TextDecoder('utf-8');
    let txtContent = decoder.decode(fileContent).trim();
    txtContent = txtContent.replace(/^---[\s\S]*?\n---/g, '').trim();

    let lines = 8;
    const baseOption = {
      linesBetweenSegments: lines,
      fallbackParagraphsPerChapter: 100,
      index: options.index,
    };
    const count = this.probeChapterCount(txtContent, metadata, baseOption);

    if (count < 2) {
      const c7 = this.probeChapterCount(txtContent, metadata, {
        ...baseOption,
        linesBetweenSegments: 7,
      });
      lines = c7 < 2 ? 6 : 7;
    } else {
      lines = 7;
    }

    const chapters = this.extractChapters(
      txtContent,
      { ...baseOption, linesBetweenSegments: lines },
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

  /** Internal API for tests */
  public getChapterRegexps(language: string): RegExp[] {
    return this.createChapterRegexps(language);
  }

  /** Internal API for tests */
  private createChapterRegexps(language: string): RegExp[] {
    const englishKeywords =
      'Chapter|Section|Part|Book|Volume|Act|Prologue|Epilogue|Introduction|Foreword|Preface|Afterword';
    if (language === 'zh') {
      return [
        new RegExp(
          `^\\s*(?:第[0-9一二三四五六七八九十百零〇\\s]+[章节回讲篇封本册部话卷]|楔子|前言|简介|引言|序言|序章|总论|概论|后记|${englishKeywords}).*$`,
          'ium',
        ),
        /^\s*(?:[0-9一二三四五六七八九十百零〇\s]+(?:[：:]|\s+)|#{1,3}\s+).*$/imu,
      ];
    }
    return [
      new RegExp(
        `^\\s*(?:${englishKeywords})(?:[\\s.:]+(?:[\\d.VXLCDM]+|[IVXLCDM]{2,}))?(?![\\s]*[a-zA-Z])`,
        'im',
      ),
      /^\s*(?:#{1,3}\s+|\\d+(?:\\.\\d+)*\\s*[A-Z]|\\d+[A-Z]).*$/m,
    ];
  }

  /** Internal API for tests */
  public detectEncoding(buffer: ArrayBuffer): string {
    const sampleSize = Math.min(buffer.byteLength, 64 * 1024);
    const sample = new Uint8Array(buffer.slice(0, sampleSize));
    const decoder = new TextDecoder('utf-8', { fatal: true });
    try {
      if (buffer.byteLength > 64 * 1024) {
        decoder.decode(buffer.slice(0, 8192), { stream: true });
        decoder.decode(buffer.slice(8192, 16384), { stream: true });
      }
      decoder.decode(sample);
      return 'utf-8';
    } catch {
      return 'windows-1252';
    }
  }

  /** Internal API for tests */
  public *iterateSegmentsFromTextChunks(
    chunks: Iterable<string>,
    lines: number,
  ): Generator<string> {
    let buffer = '';
    const regex = new RegExp(`(?:\\r?\\n){${lines},}`);
    for (const chunk of chunks) {
      buffer += chunk;
      const parts = buffer.split(regex);
      while (parts.length > 1) {
        yield parts.shift()!.trim();
      }
      buffer = parts[0]!;
    }
    if (buffer.trim()) yield buffer.trim();
  }

  /** Internal API for tests */
  private async detectEncodingFromFile(file: File): Promise<string> {
    const buffer = await file.slice(0, 64 * 1024).arrayBuffer();
    return this.detectEncoding(buffer);
  }

  /** Internal API for tests */
  public async *iterateSegmentsFromFile(file: File, encoding: string, lines: number) {
    if (typeof file.text === 'function' && file.size && file.size < 5 * 1024 * 1024) {
      const content = await file.text();
      const segments = content.split(new RegExp(`(?:\\r?\\n){${lines},}`));
      for (const segment of segments) {
        yield segment;
      }
    } else {
      const reader = file.stream().getReader();
      try {
        const decoder = new TextDecoder(encoding);
        let buffer = '';
        const regex = new RegExp(`(?:\\r?\\n){${lines},}`);
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split(regex);
          while (parts.length > 1) {
            yield parts.shift()!.trim();
          }
          buffer = parts[0]!;
        }
        buffer += decoder.decode();
        if (buffer.trim()) yield buffer.trim();
      } finally {
        await reader.cancel();
        reader.releaseLock();
      }
    }
  }

  /** Internal API for tests */
  public async extractChaptersFromFileBySegments(
    file: File,
    encoding: string,
    metadata: Metadata,
    option: ExtractChapterOptions,
  ): Promise<Chapter[]> {
    const chapters: Chapter[] = [];
    for await (const segment of this.iterateSegmentsFromFile(
      file,
      encoding,
      option.linesBetweenSegments,
    )) {
      chapters.push(...this.extractChaptersFromSegment(segment, metadata, option));
    }
    return chapters;
  }

  /** Internal API for tests */
  public async probeChapterCountFromFileBySegments(
    file: File,
    encoding: string,
    metadata: Metadata,
    option: ExtractChapterOptions,
  ): Promise<number> {
    const chapters = await this.extractChaptersFromFileBySegments(file, encoding, metadata, option);
    return chapters.length;
  }

  /** Internal API for tests */
  public probeChapterCount(
    txtContent: string,
    metadata: Metadata,
    option: ExtractChapterOptions,
  ): number {
    return this.extractChapters(txtContent, option, metadata).length;
  }

  public extractChapters(
    txtContent: string,
    option: ExtractChapterOptions,
    metadata: Metadata,
  ): Chapter[] {
    const { linesBetweenSegments, index } = option;
    const segmentRegex = new RegExp(`(?:\\r?\\n){${linesBetweenSegments},}|-{8,}\r?\n`);
    const chapters: Chapter[] = [];
    const segments = txtContent.split(segmentRegex);

    for (const segment of segments) {
      const segmentChapters = this.extractChaptersFromSegment(segment, metadata, option);
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

  private extractChaptersFromSegment(
    segment: string,
    metadata: Metadata,
    option?: ExtractChapterOptions,
  ): Chapter[] {
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
    let currentIsVolume = false;

    for (const line of lines) {
      let isHeader = false;
      for (const rx of chapterRegexps) {
        if (rx.test(line)) {
          if (currentContent.length > 0 || currentTitle) {
            segmentChapters.push({
              title: currentTitle || '...',
              content: this.formatLines(currentContent),
              isVolume: currentIsVolume,
            });
          }
          currentTitle = line.replace(/[#<>]+/g, '').trim();
          currentIsVolume =
            line.includes('卷') ||
            line.includes('部') ||
            line.includes('册') ||
            line.includes('本');
          currentContent = [];
          isHeader = true;
          break;
        }
      }
      if (!isHeader) currentContent.push(line);
    }

    if (segmentChapters.length === 0 && option?.fallbackParagraphsPerChapter) {
      const pPerChapter = option.fallbackParagraphsPerChapter;
      for (let i = 0; i < lines.length; i += pPerChapter) {
        const chunk = lines.slice(i, i + pPerChapter);
        segmentChapters.push({
          title: chunk[0]!.slice(0, 40) + (chunk[0]!.length > 40 ? '...' : ''),
          content: this.formatLines(chunk),
          isVolume: false,
        });
      }
      return segmentChapters;
    }

    if (currentContent.length > 0 || currentTitle) {
      segmentChapters.push({
        title: currentTitle || '...',
        content: this.formatLines(currentContent),
        isVolume: currentIsVolume,
      });
    }

    return segmentChapters;
  }

  private formatLines(lines: string[]): string {
    const htmlLines: string[] = [];
    let inArabic = false;
    let arabicBuffer: string[] = [];

    for (let line of lines) {
      if (
        line.trim().startsWith('<div class="arabic-block"') ||
        line.trim().startsWith('<div class="risale-page-marker"') ||
        line.trim().startsWith('<div class="risale-subtitle"') ||
        line.trim().startsWith('<div class="translated-quote"')
      ) {
        htmlLines.push(line);
        continue;
      }

      line = line.replace(/\[\[PAGE_(\d+)\]\]/g, '<div class="risale-page-marker">стр. $1</div>');
      line = line.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      line = line.replace(/\*(.*?)\*/g, '<em>$1</em>');

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

  /** Internal API for tests */
  public joinAroundUndefined(arr: (string | undefined)[]): string[] {
    const result: string[] = [];
    for (let i = 0; i < arr.length; i++) {
      const item = arr[i];
      if (item === undefined) {
        if (result.length > 0 && i + 1 < arr.length && typeof arr[i + 1] === 'string') {
          result[result.length - 1] += arr[i + 1];
          i++;
        }
      } else {
        result.push(item);
      }
    }
    return result;
  }

  /** Internal API for tests */
  public isGoodMatches(matches: string[], maxLength = 100000): boolean {
    if (matches.length < 2) return false;
    const meaningful = matches.filter((m) => m.trim().length > 0);
    if (meaningful.length < 2) return false;
    return meaningful.every((m) => m.length <= maxLength);
  }

  public async createEpub(chapters: Chapter[], metadata: Metadata): Promise<Blob> {
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
          `<navPoint id="cp${i + 1}" playOrder="${i + 1}"><navLabel><text>${escapeXml(
            c.title,
          )}</text></navLabel><content src="OEBPS/chapter${i + 1}.xhtml"/></navPoint>`,
      )
      .join('\n');
    const tocNcx = `<?xml version="1.0" encoding="UTF-8"?><ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><head><meta name="dtb:uid" content="${
      metadata.identifier
    }"/></head><docTitle><text>${escapeXml(
      metadata.bookTitle,
    )}</text></docTitle><navMap>${navPoints}</navMap></ncx>`;
    await zipWriter.add('toc.ncx', new TextReader(tocNcx), zipWriteOptions);

    const manifest = chapters
      .map(
        (_, i) =>
          `<item id="ch${i + 1}" href="OEBPS/chapter${i + 1}.xhtml" media-type="application/xhtml+xml"/>`,
      )
      .join('\n');
    const spine = chapters.map((_, i) => `<itemref idref="ch${i + 1}"/>`).join('\n');
    const contentOpf = `<?xml version="1.0" encoding="UTF-8"?><package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="bid"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${escapeXml(
      metadata.bookTitle,
    )}</dc:title><dc:language>${metadata.language}</dc:language><dc:creator>${escapeXml(
      metadata.author,
    )}</dc:creator><dc:identifier id="bid">${
      metadata.identifier
    }</dc:identifier></metadata><manifest>${manifest}<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/><item id="css" href="style.css" media-type="text/css"/></manifest><spine toc="ncx">${spine}</spine></package>`;
    await zipWriter.add('content.opf', new TextReader(contentOpf), zipWriteOptions);

    const css = `body { font-family: sans-serif; text-align: justify; line-height: 1.6; padding: 5%; } .centered-title { text-align: center; margin: 1em 0; font-weight: bold; } .arabic-block { text-align: center; color: #b03030; direction: rtl; font-size: 1.4em; margin: 1em 0; } .right-aligned { text-align: right; font-style: italic; margin: 0.5em 0; } .centered-note { text-align: center; font-size: 0.9em; opacity: 0.8; } .risale-page-marker { text-align: right; font-size: 0.8em; opacity: 0.5; border-bottom: 1px solid #ccc; margin: 1em 0; }`;
    await zipWriter.add('style.css', new TextReader(css), zipWriteOptions);

    for (let i = 0; i < chapters.length; i++) {
      const xhtml = `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml" lang="${metadata.language}" xml:lang="${metadata.language}"><head><title>${escapeXml(
        chapters[i]!.title,
      )}</title><link rel="stylesheet" type="text/css" href="../style.css"/></head><body>${
        chapters[i]!.content
      }</body></html>`;
      await zipWriter.add(`OEBPS/chapter${i + 1}.xhtml`, new TextReader(xhtml), zipWriteOptions);
    }

    return await zipWriter.close();
  }
}
