/**
 * Built-in Books Service
 *
 * Manages books that ship with the app (Risale-i Nur collection).
 * These books are auto-imported on first launch and cannot be deleted.
 */

import type { Book } from '@/types/book';

// ── Manifest ────────────────────────────────────────────────────────

export interface BuiltinBookEntry {
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
}

/**
 * Built-in books manifest.
 * Add new built-in books here as they become available.
 */
export const BUILTIN_BOOKS: BuiltinBookEntry[] = [
  {
    filename: 'sozler.epub',
    title: 'Sözler',
    author: 'Bediüzzaman Said Nursi',
    language: 'tr',
    group: 'risale',
  },
  // More books will be added as they are generated:
  // { filename: 'lemalar.epub', title: 'Lem\'alar', ... },
  // { filename: 'mektubat.epub', title: 'Mektubat', ... },
  // { filename: 'sualar.epub', title: 'Şuâlar', ... },
];

/** URL prefix for fetching builtin books.
 * Must be an absolute URL for the book import pipeline. */
export function getBuiltinBooksBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/builtin-books`;
  }
  // Fallback for SSR — should be overridden via env var in production
  return process.env['NEXT_PUBLIC_BUILTIN_BOOKS_URL'] || 'http://localhost:3000/builtin-books';
}

/** @deprecated — prefer getBuiltinBooksBaseUrl() */
export const BUILTIN_BOOKS_BASE_URL = '/builtin-books';

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Check if a book is a built-in book.
 */
export function isBuiltinBook(book: Book): boolean {
  return book.builtin === true;
}

/**
 * Check if a book matches a builtin entry by title.
 */
export function findBuiltinEntry(book: Book): BuiltinBookEntry | undefined {
  return BUILTIN_BOOKS.find(
    (entry) => book.builtin && (book.title === entry.title || book.sourceTitle === entry.filename),
  );
}
