import { useEffect, useRef, useState } from 'react';

import { useEnv } from '@/context/EnvContext';
import type { Book } from '@/types/book';
import { BUILTIN_BOOKS, BUILTIN_BOOKS_BASE_URL } from '@/services/builtinBooks';
import { useLibraryStore } from '@/store/libraryStore';

/**
 * Ensures built-in Risale-i Nur books are always in the library.
 *
 * Runs on every app start: checks if each built-in book is already
 * present (by title match against the existing library) and imports
 * any that are missing.  Books imported this way are tagged
 * `builtin: true` so they can be protected from accidental deletion
 * elsewhere in the UI.
 */
export const useBuiltinBooks = () => {
  const { envConfig } = useEnv();
  const [books, setBooks] = useState<Book[]>([]);
  const isLoading = useRef(false);
  const library = useLibraryStore((s) => s.library);

  // Track whether the library store has been initialised so we run once
  // whether the library is empty or not.
  const libraryLoaded = useLibraryStore((s) => s.libraryLoaded);

  useEffect(() => {
    if (isLoading.current || !libraryLoaded) return;
    isLoading.current = true;

    const importMissing = async () => {
      const appService = await envConfig.getAppService();
      const newBooks: Book[] = [];

      for (const entry of BUILTIN_BOOKS) {
        // Skip if already in library (match by title)
        const exists = library.some((b) => b.title === entry.title && b.builtin);
        if (exists) continue;

        try {
          const url = `${BUILTIN_BOOKS_BASE_URL}/${entry.filename}`;
          console.log(`[BuiltinBooks] Importing: ${entry.title} from ${url}`);
          const book = await appService.importBook(url, [], { saveBook: true });
          if (book) {
            // Tag as built-in
            book.builtin = true;
            newBooks.push(book);
          }
        } catch (err) {
          console.warn(`[BuiltinBooks] Failed to import ${entry.title}:`, err);
        }
      }

      if (newBooks.length) {
        setBooks(newBooks);
      }
    };

    importMissing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [library.length]);

  return books;
};
