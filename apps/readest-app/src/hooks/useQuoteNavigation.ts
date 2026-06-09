/**
 * useQuoteNavigation — handles clicks on dictionary quotes to navigate
 * to the actual book page where the quote appears.
 *
 * When a user clicks a quote in the AI dictionary popup, a
 * `risale:navigate-to-quote` CustomEvent fires with:
 *   { bookSlug: string, searchQuery: string }
 *
 * This hook:
 *   1. Finds the book in the library by matching the slug to the title
 *   2. Navigates to the reader with a `search=` query param
 *   3. The reader picks up the search param and triggers text search
 */

import { useEffect } from 'react';
import { useLibraryStore } from '@/store/libraryStore';
import { useReaderStore } from '@/store/readerStore';
import { navigateToReader } from '@/utils/nav';
import { useAppRouter } from '@/hooks/useAppRouter';
import { eventDispatcher } from '@/utils/event';

/** Convert a Turkish book title to a URL-safe slug matching the corpus slugs. */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[â]/g, 'a')
    .replace(/[î]/g, 'i')
    .replace(/[û]/g, 'u')
    .replace(/[ğ]/g, 'g')
    .replace(/[ş]/g, 's')
    .replace(/[ç]/g, 'c')
    .replace(/[ö]/g, 'o')
    .replace(/[ü]/g, 'u')
    .replace(/[ı]/g, 'i')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function useQuoteNavigation() {
  const { library } = useLibraryStore();
  const readerStore = useReaderStore;
  const router = useAppRouter();

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ bookSlug: string; searchQuery: string }>).detail;
      if (!detail?.bookSlug || !detail?.searchQuery) return;

      const { bookSlug, searchQuery } = detail;

      // Find the book by matching slugified title against the corpus slug
      const book = library.find((b) => slugify(b.title) === bookSlug);
      if (!book) {
        console.warn('[QuoteNav] Book not found for slug:', bookSlug);
        return;
      }

      // If the target book is already open in the reader, just trigger a
      // text search in-place — don't navigate away.
      const allViewStates = readerStore.getState().viewStates;
      const alreadyOpenKey = Object.keys(allViewStates).find(
        (k) => k.startsWith(book.hash),
      );
      if (alreadyOpenKey) {
        eventDispatcher.dispatch('search-term', { term: searchQuery, bookKey: alreadyOpenKey });
        return;
      }

      // Navigate to the book in reader mode with a search query.
      // The reader picks up `search=` from the URL and triggers a text search.
      const query = encodeURIComponent(searchQuery);
      navigateToReader(router, [book.hash], `search=${query}`);
    };

    window.addEventListener('risale:navigate-to-quote', handler);
    return () => window.removeEventListener('risale:navigate-to-quote', handler);
  }, [library, router, readerStore]);
}
