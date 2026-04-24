import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { scrollProgress, readerView } from '../../stores/readerStore';

interface ProgressFooterProps {
  chapterName?: string;
}

export const ProgressFooter: React.FC<ProgressFooterProps> = ({ chapterName = '' }) => {
  const progress = useStore(scrollProgress);
  const view = useStore(readerView);
  const [timeEstimate, setTimeEstimate] = useState('');
  const [pageInfo, setPageInfo] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateProgress = () => {
      if (view === 'book') {
        const container = document.getElementById('book-content');
        if (!container) return;
        const scrollWidth = container.scrollWidth - container.clientWidth;
        
        const totalPages = Math.ceil(container.scrollWidth / container.clientWidth);
        const currentPage = Math.round(container.scrollLeft / container.clientWidth) + 1;
        setPageInfo(`${currentPage} / ${totalPages}`);

        if (scrollWidth > 0) {
          const pct = Math.round((container.scrollLeft / scrollWidth) * 100);
          scrollProgress.set(Math.min(100, Math.max(0, pct)));
        } else {
          scrollProgress.set(100);
        }
      } else {
        const container = document.querySelector('.reader-content-center');
        if (!container) return;
        const scrollHeight = container.scrollHeight - container.clientHeight;
        setPageInfo('');
        if (scrollHeight > 0) {
          const pct = Math.round((container.scrollTop / scrollHeight) * 100);
          scrollProgress.set(Math.min(100, Math.max(0, pct)));
        } else {
          scrollProgress.set(100);
        }
      }
    };

    const containerBook = document.getElementById('book-content');
    const containerScroll = document.querySelector('.reader-content-center');

    if (containerBook) containerBook.addEventListener('scroll', updateProgress, { passive: true });
    if (containerScroll) containerScroll.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    
    // Initial calculations need a delay to allow layout and fonts to settle
    const to = setTimeout(updateProgress, 300);

    return () => {
      if (containerBook) containerBook.removeEventListener('scroll', updateProgress);
      if (containerScroll) containerScroll.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
      clearTimeout(to);
    };
  }, [view]);

  const totalWordsRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const remaining = 100 - progress;
    if (remaining <= 0) { setTimeEstimate('Конец главы'); return; }

    if (totalWordsRef.current === null || totalWordsRef.current === 0) {
      const pageEl = document.querySelector('.reader-page');
      const text = pageEl?.textContent;
      if (text) {
        totalWordsRef.current = text.split(/\s+/).length;
      }
    }

    const totalWords = totalWordsRef.current || 0;
    const remainingWords = Math.round(totalWords * (remaining / 100));
    const minutes = Math.round(remainingWords / 200);
    if (minutes < 1) { setTimeEstimate('менее 1 мин'); return; }
    if (minutes < 60) { setTimeEstimate(`~${minutes} мин до конца`); return; }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    setTimeEstimate(mins > 0 ? `~${hours} ч ${mins} мин` : `~${hours} ч`);
  }, [progress]);

  const scrollToPercent = useCallback((pct: number) => {
    if (view === 'book') {
      const container = document.getElementById('book-content');
      if (!container) return;
      const scrollWidth = container.scrollWidth - container.clientWidth;
      const targetScroll = scrollWidth * pct;
      const targetPage = Math.round(targetScroll / container.clientWidth);
      container.scrollTo({ left: targetPage * container.clientWidth, behavior: isDragging ? 'instant' : 'smooth' });
    } else {
      const container = document.querySelector('.reader-content-center');
      if (!container) return;
      const scrollHeight = container.scrollHeight - container.clientHeight;
      container.scrollTo({ top: scrollHeight * pct, behavior: isDragging ? 'instant' : 'smooth' });
    }
  }, [isDragging, view]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width);
    scrollToPercent(Math.max(0, Math.min(1, pct)));
  };

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const onMove = (ev: MouseEvent) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      scrollProgress.set(Math.round(pct * 100));
      scrollToPercent(pct);
    };

    const onUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [scrollToPercent]);

  return (
    <footer className="reader-footer">
      <div className="progress-track" ref={trackRef} onClick={handleProgressClick}>
        <div className="progress-fill" style={{ width: `${progress}%` }} />
        <div
          className="progress-thumb"
          style={{ left: `${progress}%`, transform: `translate(-50%, -50%) scale(1)` }}
          onMouseDown={handleDragStart}
        />
      </div>
      <div className="reader-footer-info">
        <span style={{ maxWidth: '40%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {chapterName}
        </span>
        <span>{pageInfo ? `Стр. ${pageInfo} · ` : ''}Прочитано {progress}% · {timeEstimate}</span>
      </div>
    </footer>
  );
};

