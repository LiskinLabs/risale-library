import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { isSettingsPanelOpen, isTocModalOpen } from '../../stores/readerStore';

interface ReaderHeaderProps {
  title: string;
  backUrl?: string;
}

export const ReaderHeader: React.FC<ReaderHeaderProps> = ({ title, backUrl = '/' }) => {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
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

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`reader-header ${!isVisible ? 'hidden' : ''}`}>
      {/* Left — Back */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '80px' }}>
        <a
          href={backUrl}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.3rem',
            color: 'var(--text-muted)', textDecoration: 'none',
            fontSize: '0.85rem', fontWeight: 500 
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          <span className="hidden sm:inline">Библиотека</span>
        </a>
      </div>

      {/* Center — Title */}
      <div className="reader-header-title">{title}</div>

      {/* Right — Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', minWidth: '120px', justifyContent: 'flex-end' }}>
        {/* TOC Button */}
        <button
          onClick={() => isTocModalOpen.set(true)}
          title="Оглавление"
          style={{
            width: '36px', height: '36px', borderRadius: '8px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)',
            transition: 'color 0.15s ease'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="10" y2="18"/>
          </svg>
        </button>

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
