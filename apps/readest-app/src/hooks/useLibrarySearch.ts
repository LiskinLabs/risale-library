import { create, insert, search } from '@orama/orama';
import { useEffect, useState } from 'react';
import { Book } from '@/types/book';
import { useLibraryStore } from '@/store/libraryStore';

/**
 * Fast Library Search hook powered by Orama.
 * Provides instant full-text search over book metadata.
 */
export const useLibrarySearch = (query: string) => {
  const { visibleLibrary } = useLibraryStore();
  const [db, setDb] = useState<unknown>(null);
  const [results, setResults] = useState<Book[]>([]);

  useEffect(() => {
    const initDb = async () => {
      const oramaDb = await create({
        schema: {
          title: 'string',
          author: 'string',
          tags: 'string[]',
          description: 'string',
        },
      });

      for (const book of visibleLibrary) {
        await insert(oramaDb, {
          id: book.hash,
          title: book.title,
          author: book.author || book.metadata?.author || '',
          tags: book.tags || [],
          description: book.metadata?.description || '',
          // biome-ignore lint/suspicious/noExplicitAny: required by Orama types
        } as any);
      }

      setDb(oramaDb);
    };

    if (visibleLibrary.length > 0) {
      initDb();
    }
  }, [visibleLibrary]);

  useEffect(() => {
    const performSearch = async () => {
      if (!db || !query) {
        setResults(visibleLibrary);
        return;
      }

      // biome-ignore lint/suspicious/noExplicitAny: required by Orama types
      const searchResults = await search(db as any, {
        term: query,
        properties: ['title', 'author', 'tags', 'description'],
        tolerance: 1,
      });

      const matchedHashes = new Set(searchResults.hits.map((hit) => hit.id));
      setResults(visibleLibrary.filter((book) => matchedHashes.has(book.hash)));
    };

    performSearch();
  }, [query, db, visibleLibrary]);

  return results;
};
