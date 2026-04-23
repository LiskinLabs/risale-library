import React, { useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { readerView, readerAnimations } from '../../stores/readerStore';

export const PageNavigator: React.FC = () => {
  const view = useStore(readerView);
  const animations = useStore(readerAnimations);
  
  // Only render when in "book" mode
  if (view !== 'book') return null;

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Only interfere if we are scrolling vertically over the book container
      if (Math.abs(e.deltaY) > 20) {
        e.preventDefault();
        if (e.deltaY > 0) goNext();
        else goPrev();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        goNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        goPrev();
      }
    };

    // Attach non-passive wheel listener to allow preventDefault
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const isScrollingRef = useRef(false);

  const goNext = () => {
    if (isScrollingRef.current) return;
    const el = document.getElementById('book-content');
    if (el) {
      isScrollingRef.current = true;
      const gap = parseFloat(window.getComputedStyle(el).columnGap || '0');
      const offset = el.clientWidth + gap;
      el.scrollBy({ left: offset, behavior: animations ? 'smooth' : 'instant' });
      setTimeout(() => { isScrollingRef.current = false; }, animations ? 400 : 50);
    }
  };

  const goPrev = () => {
    if (isScrollingRef.current) return;
    const el = document.getElementById('book-content');
    if (el) {
      isScrollingRef.current = true;
      const gap = parseFloat(window.getComputedStyle(el).columnGap || '0');
      const offset = el.clientWidth + gap;
      el.scrollBy({ left: -offset, behavior: animations ? 'smooth' : 'instant' });
      setTimeout(() => { isScrollingRef.current = false; }, animations ? 400 : 50);
    }
  };

  return (
    <>
      <button 
        className="fixed left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 flex items-center justify-center bg-gray-500/20 hover:bg-gray-500/40 rounded-full text-white/70 hover:text-white transition-colors"
        onClick={goPrev}
        title="Предыдущая страница"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      </button>

      <button 
        className="fixed right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 flex items-center justify-center bg-gray-500/20 hover:bg-gray-500/40 rounded-full text-white/70 hover:text-white transition-colors"
        onClick={goNext}
        title="Следующая страница"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
      </button>
    </>
  );
};
