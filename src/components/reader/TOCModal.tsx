import React, { useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { isTocModalOpen } from '../../stores/readerStore';

interface TocHeading {
  depth: number;
  slug: string;
  text: string;
}

interface TOCModalProps {
  headings: TocHeading[];
  bookTitle?: string;
}

export const TOCModal: React.FC<TOCModalProps> = ({ headings, bookTitle = '' }) => {
  const isOpen = useStore(isTocModalOpen);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') isTocModalOpen.set(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  // Prevent body scroll while open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) isTocModalOpen.set(false);
  };

  const handleItemClick = (slug: string) => {
    isTocModalOpen.set(false);
    // Small delay to let modal close before scrolling
    setTimeout(() => {
      const el = document.getElementById(slug);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  return (
    <div className="toc-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="toc-modal">
        {/* Header */}
        <div className="toc-modal-header">
          <div>
            <div className="toc-modal-subtitle">Оглавление</div>
            {bookTitle && <div className="toc-modal-title">{bookTitle}</div>}
          </div>
          <button
            onClick={() => isTocModalOpen.set(false)}
            className="toc-close-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18"/><path d="M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* List */}
        <div className="toc-modal-list">
          {headings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <p>Оглавление пусто</p>
            </div>
          ) : (
            headings.map((h, i) => (
              <button
                key={`${h.slug}-${i}`}
                onClick={() => handleItemClick(h.slug)}
                className="toc-item"
                data-depth={h.depth}
              >
                {h.text}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
