import { useEffect, useRef, useState } from 'react';

import { useEnv } from '@/context/EnvContext';
import { Book } from '@/types/book';

import risaleLibrary from '@/data/demo/risale.json';
import { openIndexedDB } from '@/services/webAppService';

interface DemoBooks {
  library: string[];
}

export const useDemoBooks = () => {
  const { envConfig } = useEnv();
  const [books, setBooks] = useState<Book[]>([]);
  const isLoading = useRef(false);

  useEffect(() => {
    if (isLoading.current) return;
    isLoading.current = true;

    const fetchDemoBooks = async () => {
      try {
        const appService = await envConfig.getAppService();
        const demoData = risaleLibrary as DemoBooks;

        const library = demoData.library;
        const batchSize = 10;
        const loadedBooks: Book[] = [];

        for (let i = 0; i < library.length; i += batchSize) {
          const batch = library.slice(i, i + batchSize);
          const results = await Promise.all(
            batch.map(async (url) => {
              try {
                return await appService.importBook(url, [], { saveBook: true });
              } catch (e) {
                console.warn(`Failed to import demo book: ${url}`, e);
                return null;
              }
            }),
          );
          loadedBooks.push(...results.filter((b): b is Book => b !== null));
          setBooks([...loadedBooks]);
        }
      } catch (error) {
        console.error('Failed to import Risale library:', error);
      }
    };

    const DATA_VERSION = '2026-04-30-v5';
    const demoBooksVersion = localStorage.getItem('demoBooksVersion');

    if (demoBooksVersion !== DATA_VERSION) {
      // Глубокая очистка базы данных от старых битых книг
      const deepClear = async () => {
        try {
          const db = await openIndexedDB();
          const transaction = db.transaction(['files'], 'readwrite');
          const store = transaction.objectStore('files');
          store.clear();
          console.log("IndexedDB 'files' store cleared for v5 update.");

          transaction.oncomplete = () => {
            fetchDemoBooks();
            localStorage.setItem('demoBooksVersion', DATA_VERSION);
          };
        } catch (e) {
          console.error('Failed to clear old books:', e);
          fetchDemoBooks();
          localStorage.setItem('demoBooksVersion', DATA_VERSION);
        }
      };
      deepClear();
    }
  }, [envConfig]);

  return { books };
};
