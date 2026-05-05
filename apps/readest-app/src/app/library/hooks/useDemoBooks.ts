import { useEffect, useRef, useState } from 'react';
import { Book } from '@/types/book';
import { getAssetPath } from '@/utils/assetPath';
import { md5Fingerprint } from '@/utils/md5';

interface CatalogBook {
  title: string;
  main: string;
  shelf: string;
  url: string;
  cover: string;
}

export const useDemoBooks = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const isLoaded = useRef(false);

  useEffect(() => {
    if (isLoaded.current) return;
    isLoaded.current = true;

    const fetchCatalog = async () => {
      try {
        const response = await fetch(getAssetPath('/catalog.json'));
        if (!response.ok) throw new Error('Failed to fetch catalog');

        const library: CatalogBook[] = await response.json();

        const catalogBooks: Book[] = library.map((item) => {
          // Use a deterministic hash based on the URL for catalog books
          const hash = md5Fingerprint(item.url);

          return {
            hash,
            title: item.title,
            author: 'Said Nursi', // Default author for Risale-i Nur
            format: 'MD',
            url: getAssetPath(item.url),
            coverImageUrl: getAssetPath(item.cover),
            groupName: item.shelf,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            downloadedAt: Date.now(), // Treat as available since it's in public/
          };
        });

        setBooks(catalogBooks);
      } catch (error) {
        console.error('Failed to load catalog library:', error);
      }
    };

    fetchCatalog();
  }, []);

  return { books };
};
