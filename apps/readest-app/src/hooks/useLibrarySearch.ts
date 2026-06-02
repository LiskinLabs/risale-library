import { create, insert, search } from '@orama/orama';
import { useEffect, useState } from 'react';
import { Book } from '@/types/book';
import { useLibraryStore } from '@/store/libraryStore';

/**
 * Fast Library Search hook powered by Orama.
 * Provides instant full-text search over book metadata.
 */
export const useLibrarySearch = (query: string) => {
  const { library } = useLibraryStore();
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

      const nonDeletedBooks = library.filter((b) => !b.deletedAt);

      for (const book of nonDeletedBooks) {
        const author =
          typeof book.author === 'string'
            ? book.author
            : // biome-ignore lint/suspicious/noExplicitAny: required for polymorphic author type
              ((book.author as any)?.name as string) || (book.metadata?.author as string) || '';

        await insert(oramaDb, {
          title: book.title,
          author: author,
          tags: (book.tags || []) as string[],
          description: book.metadata?.description || '',
        });
      }

      setDb(oramaDb);
    };

    if (library.length > 0) {
      initDb();
    }
  }, [library]);

  useEffect(() => {
    const performSearch = async () => {
      const nonDeletedBooks = library.filter((b) => !b.deletedAt);
      if (!db || !query) {
        setResults(nonDeletedBooks);
        return;
      }

      try {
        // biome-ignore lint/suspicious/noExplicitAny: required by Orama types
        const searchResults = await search(db as any, {
          term: query,
          properties: ['title', 'author', 'tags', 'description'],
          tolerance: 1,
        });

        const matchedHashes = new Set(searchResults.hits.map((hit) => hit.id));
        setResults(nonDeletedBooks.filter((book) => matchedHashes.has(book.hash)));
      } catch (e) {
        console.error('Orama search error:', e);
        setResults(nonDeletedBooks);
      }
    };

    performSearch();
  }, [query, db, library]);

  return results;
};
