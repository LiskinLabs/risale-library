/**
 * Author Notes Service — loads Silvestr's personal commentary from EPUB.
 *
 * Author notes are stored inside EPUB files as:
 *   annotations/author-notes.json
 *
 * They're loaded at book import time and converted to protected BookNotes
 * so the user can see them as a layer but cannot delete them.
 */

import type { BookNote, AnnotationLayer } from '@/types/book';

export interface AuthorNoteEntry {
  id: string;
  cfi: string;
  text: string; // The text being annotated
  note: string; // Author's commentary (HTML)
  category?: string; // e.g. 'tefsir', 'tarih', 'hatira'
  locale?: string; // ru, tr, en, ...
}

export interface AuthorNotesManifest {
  version: number;
  author: string;
  locale: string;
  notes: AuthorNoteEntry[];
}

/**
 * Load author notes from an EPUB's annotations/author-notes.json.
 * Called during book import by the book import pipeline.
 */
export async function loadAuthorNotes(epubZip: {
  readFile: (path: string) => Promise<Uint8Array>;
}): Promise<AuthorNotesManifest | null> {
  try {
    const data = await epubZip.readFile('OEBPS/annotations/author-notes.json');
    const manifest: AuthorNotesManifest = JSON.parse(new TextDecoder().decode(data));
    if (!manifest.notes || !Array.isArray(manifest.notes)) return null;
    return manifest;
  } catch {
    // Not all EPUBs have author notes — that's fine
    return null;
  }
}

/**
 * Convert author note entries to BookNote format for the annotation system.
 * These notes are `protected` (cannot be deleted) and tagged as layer='author'.
 */
export function authorNotesToBookNotes(
  entries: AuthorNoteEntry[],
  bookHash: string,
): Omit<BookNote, 'createdAt' | 'updatedAt'>[] {
  const now = Date.now();
  return entries.map((entry) => ({
    bookHash,
    id: `author-${entry.id}`,
    type: 'annotation' as const,
    cfi: entry.cfi,
    text: entry.text,
    note: entry.note,
    style: 'highlight' as const,
    color: '#a78bfa', // violet — author color
    protected: true,
    layer: 'author' as AnnotationLayer,
    locale: entry.locale || 'ru',
    createdAt: now,
    updatedAt: now,
  }));
}
