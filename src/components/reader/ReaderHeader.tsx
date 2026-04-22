import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { isSettingsPanelOpen, isLeftSidebarOpen } from '../../stores/readerStore';

interface ReaderHeaderProps {
  title: string;
  backUrl?: string;
}

export const ReaderHeader: React.FC<ReaderHeaderProps> = ({ title, backUrl = '/' }) => {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    // We now listen to the scroll of the central container instead of window
    const container = document.querySelector('.reader-content-center');
    if (!container) return;

    const handleScroll = () => {
      const currentY = container.scrollTop;
      // Show header when scrolling up or near top
      if (currentY < 80 || currentY < lastScrollY.current - 5) {
        setIsVisible(true);
      } else if (currentY > lastScrollY.current + 5) {
        setIsVisible(false);
        // Close settings panel when hiding header
        isSettingsPanelOpen.set(false);
      }
      lastScrollY.current = currentY;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`reader-header sticky top-0 z-30 transition-transform duration-300 ${!isVisible ? '-translate-y-full' : 'translate-y-0'}`}>
      {/* Left — Back & TOC Toggle (Mobile only) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '80px' }}>
        <button
          id="toc-trigger"
          className="lg:hidden flex items-center justify-center p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          onClick={() => isLeftSidebarOpen.set(!isLeftSidebarOpen.get())}
          title="Оглавление"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="10" y2="18"/>
          </svg>
        </button>
        <a
          href={backUrl}
          className="hidden sm:flex"
          style={{ 
            alignItems: 'center', gap: '0.3rem',
            color: 'var(--text-muted)', textDecoration: 'none',
            fontSize: '0.85rem', fontWeight: 500 
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          <span>Библиотека</span>
        </a>
      </div>

      {/* Center — Title */}
      <div className="reader-header-title truncate px-4">{title}</div>

      {/* Right — Controls */}
      <div className="relative flex items-center gap-1 min-w-[80px] justify-end">
        {/* Settings (Аа) Button */}
        <button
          id="settings-trigger"
          onClick={() => isSettingsPanelOpen.set(!isSettingsPanelOpen.get())}
          title="Настройки чтения"
          style={{
            width: '36px', height: '36px', borderRadius: '8px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)',
            fontFamily: "'Kazimir', 'Literata', serif",
            fontSize: '18px', fontWeight: 500,
            transition: 'color 0.15s ease'
          }}
        >
          Аа
        </button>

        {/* Bookmark Button */}
        <button
          title="Закладка"
          style={{
            width: '36px', height: '36px', borderRadius: '8px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)',
            transition: 'color 0.15s ease'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
          </svg>
        </button>
      </div>
    </header>
  );
};
