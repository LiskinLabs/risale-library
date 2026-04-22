import React, { useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { isLeftSidebarOpen } from '../../stores/readerStore';

interface TocHeading {
  depth: number;
  slug: string;
  text: string;
}

interface ReaderSidebarProps {
  headings: TocHeading[];
  bookTitle?: string;
}

export const ReaderSidebar: React.FC<ReaderSidebarProps> = ({ headings, bookTitle = '' }) => {
  const isOpen = useStore(isLeftSidebarOpen);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close on Escape on mobile
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && window.innerWidth <= 1024) isLeftSidebarOpen.set(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  // Click outside to close on mobile
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (window.innerWidth <= 1024 && sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        // Only close if we didn't click the toggle button
        const toggleBtn = document.getElementById('toc-trigger');
        if (!toggleBtn || !toggleBtn.contains(e.target as Node)) {
          isLeftSidebarOpen.set(false);
        }
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleItemClick = (slug: string) => {
    if (window.innerWidth <= 1024) {
      isLeftSidebarOpen.set(false);
    }

    // Find item and scroll
    const el = document.getElementById(slug);
    if (el) {
      // Small delay on mobile to let sidebar close before scrolling
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, window.innerWidth <= 1024 ? 300 : 0);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => isLeftSidebarOpen.set(false)}
      />

      <aside
        ref={sidebarRef}
        className={`reader-sidebar-left flex flex-col ${isOpen ? 'open' : ''}`}
      >
        {/* Header */}
        <div className="toc-modal-header sticky top-0 bg-[var(--bg-surface)] z-10">
          <div>
            <div className="toc-modal-subtitle">Оглавление</div>
            {bookTitle && <div className="toc-modal-title line-clamp-2">{bookTitle}</div>}
          </div>
          <button
            onClick={() => isLeftSidebarOpen.set(false)}
            className="toc-close-btn lg:hidden"
            title="Закрыть"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18"/><path d="M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* List */}
        <div className="toc-modal-list p-4 pb-12">
          {headings.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)]">
              <p>Оглавление пусто</p>
            </div>
          ) : (
            <div className="space-y-1">
              {headings.map((h, i) => (
                <button
                  key={`${h.slug}-${i}`}
                  onClick={() => handleItemClick(h.slug)}
                  className="toc-item hover:bg-[var(--bg-page)] rounded-md transition-colors"
                  data-depth={h.depth}
                >
                  {h.text}
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
