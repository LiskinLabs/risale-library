import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { isSettingsPanelOpen, isLeftSidebarOpen } from '../../stores/readerStore';

interface ReaderHeaderProps {
  title: string;
  backUrl?: string;
}

export const ReaderHeader: React.FC<ReaderHeaderProps> = ({ title, backUrl = '/' }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
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
    <header className={`reader-header ${!isVisible ? '-translate-y-full opacity-0 pointer-events-none' : ''}`}>
      {/* Left — Back & TOC Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', minWidth: '80px' }}>
        <button
          id="toc-trigger"
          className="reader-header-btn lg:hidden"
          onClick={() => isLeftSidebarOpen.set(!isLeftSidebarOpen.get())}
          title="Оглавление"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="10" y2="18"/>
          </svg>
        </button>
        <a
          href={backUrl}
          className="reader-header-btn hidden sm:flex"
          style={{ textDecoration: 'none', gap: '0.25rem', opacity: 0.6 }}
          title="Библиотека"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </a>
      </div>

      {/* Center — Title */}
      <div className="reader-header-title">{title}</div>

      {/* Right — Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.125rem', minWidth: '80px', justifyContent: 'flex-end', position: 'relative' }}>
        {/* Settings (Аа) Button */}
        <button
          id="settings-trigger"
          className="reader-header-btn"
          onClick={(e) => { e.stopPropagation(); isSettingsPanelOpen.set(!isSettingsPanelOpen.get()); }}
          title="Настройки чтения"
          style={{ fontFamily: "'Literata', serif", fontSize: '16px', fontWeight: 500 }}
        >
          Аа
        </button>

        {/* Download Button */}
        <div style={{ position: 'relative' }}>
          <button 
            className="reader-header-btn" 
            title="Скачать"
            onClick={(e) => { e.stopPropagation(); setIsDownloadOpen(!isDownloadOpen); }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
          
          {/* Download Dropdown */}
          {isDownloadOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsDownloadOpen(false)} style={{ background: 'transparent' }} />
              <div 
                className="glass-panel absolute right-0 mt-2 w-40 rounded-xl shadow-2xl z-50 overflow-hidden"
                style={{ top: '100%', display: 'flex', flexDirection: 'column' }}
              >
                {['EPUB', 'FB2', 'PDF', 'MOBI'].map((format) => (
                  <button 
                    key={format}
                    className="px-4 py-2 text-left text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    onClick={() => {
                      alert(`Скачивание формата ${format} будет доступно в следующих обновлениях.`);
                      setIsDownloadOpen(false);
                    }}
                  >
                    Скачать в {format}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Bookmark Button */}
        <button className="reader-header-btn hidden sm:flex" title="Закладка">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
          </svg>
        </button>
      </div>
    </header>
  );
};
