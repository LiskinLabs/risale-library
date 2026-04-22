import React, { useEffect, useState, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { scrollProgress } from '../../stores/readerStore';

interface ProgressFooterProps {
  chapterName?: string;
}

export const ProgressFooter: React.FC<ProgressFooterProps> = ({ chapterName = '' }) => {
  const progress = useStore(scrollProgress);
  const [timeEstimate, setTimeEstimate] = useState('');

  useEffect(() => {
    const updateProgress = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        const pct = Math.round((window.scrollY / scrollHeight) * 100);
        scrollProgress.set(Math.min(100, Math.max(0, pct)));
      }
    };

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  // Update time estimate when progress changes (client-side only)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const remaining = 100 - progress;
    if (remaining <= 0) {
      setTimeEstimate('Конец книги');
      return;
    }
    const pageEl = document.querySelector('.reader-page');
    const totalWords = pageEl?.textContent?.split(/\s+/).length || 0;
    const remainingWords = Math.round(totalWords * (remaining / 100));
    const minutes = Math.round(remainingWords / 200);
    if (minutes < 1) { setTimeEstimate('менее 1 мин'); return; }
    if (minutes < 60) { setTimeEstimate(`${minutes} мин до конца`); return; }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    setTimeEstimate(mins > 0 ? `${hours} ч ${mins} мин до конца` : `${hours} ч до конца`);
  }, [progress]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width);
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: scrollHeight * pct, behavior: 'smooth' });
  };

  return (
    <footer className="reader-footer">
      <div className="progress-track" onClick={handleProgressClick}>
        <div className="progress-fill" style={{ width: `${progress}%` }} />
        <div className="progress-thumb" style={{ left: `${progress}%` }} />
      </div>
      <div className="reader-footer-info">
        <span style={{ maxWidth: '40%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {chapterName}
        </span>
        <span>{timeEstimate}</span>
        <span>{progress}%</span>
      </div>
    </footer>
  );
};
