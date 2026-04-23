import { useEffect } from 'react';
import { readingProgress, lastReadBook } from '../../stores/readerStore';

interface Props {
  slug: string;
}

export const ReaderProgress = ({ slug }: Props) => {
  useEffect(() => {
    // 1. Set as last read book
    lastReadBook.set(slug);

    // 2. We now track scroll on the center content area
    const container = document.querySelector('.reader-content-center');
    if (!container) return;

    // Restore scroll position
    let initialScrollTimeout: ReturnType<typeof setTimeout> | null = null;
    const savedProgress = Number(readingProgress.get()[slug] || 0);
    if (savedProgress > 0) {
      // Delay to ensure layout and fonts are loaded before scrolling
      initialScrollTimeout = setTimeout(() => {
        const scrollHeight = container.scrollHeight - container.clientHeight;
        container.scrollTo(0, scrollHeight * savedProgress);
      }, 100);
    }

    // 3. Track scroll changes
    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
    const handleScroll = () => {
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(() => {
        const scrollHeight = container.scrollHeight - container.clientHeight;
        const currentScroll = container.scrollTop;
        const progress = scrollHeight > 0 ? currentScroll / scrollHeight : 0;

        // Store progress as string for persistentMap compatibility
        readingProgress.setKey(slug, progress.toString());
        scrollTimeout = null;
      }, 500); // 500ms debounce/throttle
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
      if (initialScrollTimeout) clearTimeout(initialScrollTimeout);
    };
  }, [slug]);

  return null; // Invisible component
};
