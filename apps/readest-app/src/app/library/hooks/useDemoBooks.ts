import { useEffect, useRef, useState } from 'react';

import { useEnv } from '@/context/EnvContext';
import { Book } from '@/types/book';
import { getAssetPath } from '@/utils/assetPath';
import { openIndexedDB } from '@/services/webAppService';

interface CatalogBook {
  title: string;
  main: string;
  shelf: string;
  url: string;
  cover: string;
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
        
        // Fetch the new catalog.json
        const response = await fetch(getAssetPath('/catalog.json'));
        const library: CatalogBook[] = await response.json();

        const batchSize = 15;
        const loadedBooks: Book[] = [];

        for (let i = 0; i < library.length; i += batchSize) {
          const batch = library.slice(i, i + batchSize);
          const results = await Promise.all(
            batch.map(async (item) => {
              try {
                const book = await appService.importBook(getAssetPath(item.url), [], { 
                  saveBook: true,
                  transient: false 
                });
                if (book) {
                  // Apply metadata from catalog
                  book.groupName = item.shelf;
                  book.coverImageUrl = getAssetPath(item.cover);
                  return book;
                }
                return null;
              } catch (e) {
                console.warn(`Failed to import demo book: ${item.url}`, e);
                return null;
              }
            }),
          );
          loadedBooks.push(...results.filter((b): b is Book => b !== null));
          setBooks([...loadedBooks]);
        }
      } catch (error) {
        console.error('Failed to import catalog library:', error);
      }
    };

    const DATA_VERSION = '2026-05-03-v11-premium-catalog';
    const demoBooksVersion = localStorage.getItem('demoBooksVersion');

    if (demoBooksVersion !== DATA_VERSION) {
      const deepClear = async () => {
        try {
          const db = await openIndexedDB();
          const transaction = db.transaction(['files'], 'readwrite');
          const store = transaction.objectStore('files');
          store.clear();
          
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
