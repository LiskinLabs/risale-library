import { useEffect, useRef, useState } from 'react';

import { useEnv } from '@/context/EnvContext';
import { Book } from '@/types/book';
import { getUserLang } from '@/utils/misc';
import { isWebAppPlatform } from '@/services/environment';

import libraryEn from '@/data/demo/library.en.json';
import libraryZh from '@/data/demo/library.zh.json';

const libraries = {
  en: libraryEn,
  zh: libraryZh,
};

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

    const userLang = getUserLang() as keyof typeof libraries;
    const fetchDemoBooks = async () => {
      const appService = await envConfig.getAppService();
      const demoBooks = libraries[userLang] || (libraries.en as DemoBooks);
      // Use allSettled so one failed fetch doesn't cancel all others
      const results = await Promise.allSettled(
        demoBooks.library.map((url) =>
          appService.importBook(url, [], { saveBook: false }).catch(() => null),
        ),
      );
      const books = results
        .filter((r) => r.status === 'fulfilled' && r.value !== null)
        .map((r) => (r as PromiseFulfilledResult<Book>).value);
      setBooks(books);
      if (books.length === 0 && results.length > 0) {
        console.warn(
          'Demo books unavailable — CDN may not be configured. Running in offline/local mode.',
        );
      }
    };

    const demoBooksFetchedFlag = localStorage.getItem('demoBooksFetched');
    if (isWebAppPlatform() && !demoBooksFetchedFlag) {
      fetchDemoBooks();
      localStorage.setItem('demoBooksFetched', 'true');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return books;
};
