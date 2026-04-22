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
    const savedProgress = Number(readingProgress.get()[slug] || 0);
    if (savedProgress > 0) {
      const scrollHeight = container.scrollHeight - container.clientHeight;
      container.scrollTo(0, scrollHeight * savedProgress);
    }

    // 3. Track scroll changes
    const handleScroll = () => {
      const scrollHeight = container.scrollHeight - container.clientHeight;
      const currentScroll = container.scrollTop;
      const progress = scrollHeight > 0 ? currentScroll / scrollHeight : 0;
      
      // Store progress as string for persistentMap compatibility
      readingProgress.setKey(slug, progress.toString());
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [slug]);

  return null; // Invisible component
};
