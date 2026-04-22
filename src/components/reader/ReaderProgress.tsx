import React, { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { readingProgress, lastReadBook } from '../../stores/readerStore';

interface Props {
  slug: string;
}

export const ReaderProgress = ({ slug }: Props) => {
  useEffect(() => {
    // 1. Set as last read book
    lastReadBook.set(slug);

    // 2. Restore scroll position
    const savedProgress = readingProgress.get()[slug];
    if (savedProgress) {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo(0, scrollHeight * savedProgress);
    }

    // 3. Track scroll changes
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      const progress = scrollHeight > 0 ? currentScroll / scrollHeight : 0;
      
      // Update store (throttled/debounced if needed, but nanostores persistent handles it well)
      readingProgress.setKey(slug, progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [slug]);

  return null; // Invisible component
};
