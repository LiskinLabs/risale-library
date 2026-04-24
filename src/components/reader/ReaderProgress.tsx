import { useEffect } from 'react';
import { readingProgress, lastReadBook, readerView } from '../../stores/readerStore';

interface Props {
  slug: string;
}

export const ReaderProgress = ({ slug }: Props) => {
  useEffect(() => {
    // 1. Set as last read book
    lastReadBook.set(slug);

    // 2. We track scroll on either the center content area or book content
    const containerScroll = document.querySelector('.reader-content-center');
    const containerBook = document.getElementById('book-content');

    // Restore scroll position
    let initialScrollTimeout: ReturnType<typeof setTimeout> | null = null;
    const savedProgress = Number(readingProgress.get()[slug] || 0);
    
    if (savedProgress > 0) {
      initialScrollTimeout = setTimeout(() => {
        const view = readerView.get();
        if (view === 'book' && containerBook) {
          const scrollWidth = containerBook.scrollWidth - containerBook.clientWidth;
          containerBook.scrollTo(scrollWidth * savedProgress, 0);
        } else if (containerScroll) {
          const scrollHeight = containerScroll.scrollHeight - containerScroll.clientHeight;
          containerScroll.scrollTo(0, scrollHeight * savedProgress);
        }
      }, 150); // delay ensures CSS columns are rendered
    }

    // 3. Track scroll changes
    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
    const handleScroll = () => {
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(() => {
        const view = readerView.get();
        let progress = 0;
        
        if (view === 'book' && containerBook) {
          const scrollWidth = containerBook.scrollWidth - containerBook.clientWidth;
          progress = scrollWidth > 0 ? containerBook.scrollLeft / scrollWidth : 0;
        } else if (containerScroll) {
          const scrollHeight = containerScroll.scrollHeight - containerScroll.clientHeight;
          progress = scrollHeight > 0 ? containerScroll.scrollTop / scrollHeight : 0;
        }

        readingProgress.setKey(slug, progress.toString());
        scrollTimeout = null;
      }, 500); // debounce
    };

    if (containerScroll) containerScroll.addEventListener('scroll', handleScroll, { passive: true });
    if (containerBook) containerBook.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      if (containerScroll) containerScroll.removeEventListener('scroll', handleScroll);
      if (containerBook) containerBook.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
      if (initialScrollTimeout) clearTimeout(initialScrollTimeout);
    };
  }, [slug]);

  return null;
};
