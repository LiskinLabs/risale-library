import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import { selectedWord, isRightSidebarOpen, type LugatEntry } from '../../stores/readerStore';
import lugatDataJson from '../../data/lugat_full.json';

const lugatData = lugatDataJson as Record<string, string>;
const lugatKeys = Object.keys(lugatData);

export const LugatPanel = () => {
  const selected = useStore(selectedWord);
  const isOpen = useStore(isRightSidebarOpen);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle Escape and click outside on mobile
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') isRightSidebarOpen.set(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const filteredWords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query.length < 2) return [];
    
    return lugatKeys
      .filter(w => w.toLowerCase().includes(query))
      .slice(0, 50);
  }, [searchQuery]);

  const handleClose = () => {
    isRightSidebarOpen.set(false);
    selectedWord.set(null);
  };

  const selectManualWord = (word: string) => {
    selectedWord.set({ word, meaning: lugatData[word] });
    setSearchQuery('');
  };

  return (
    <>
      {/* Universal backdrop overlay — only on mobile */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 lg:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}
        onClick={() => isRightSidebarOpen.set(false)}
      />

      {/* Side Panel (Right Sidebar) */}
      <aside className={`reader-sidebar-right ${isOpen ? 'open' : ''} glass-panel`}>
        <div className="lugat-panel-inner">
          {/* Header */}
          <div className="lugat-header sticky top-0 z-10">
            <div className="lugat-header-title">
              <div className="lugat-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
              <h2>Lügat</h2>
            </div>
            {/* Show close button on mobile, or clear button on desktop */}
            <button onClick={handleClose} className="lugat-close-btn" title="Закрыть">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="lugat-search bg-[var(--bg-surface)] relative z-10">
            <div className="lugat-search-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="lugat-search-icon">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Поиск слова..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="lugat-search-input"
              />
            </div>
          </div>

          {/* Content */}
          <div className="lugat-content flex-1">
            {searchQuery.length > 0 ? (
              <div className="lugat-results">
                {filteredWords.length > 0 ? (
                  filteredWords.map(w => (
                    <button
                      key={w}
                      onClick={() => selectManualWord(w)}
                      className="lugat-result-item"
                    >
                      <span className="lugat-result-word">{w}</span>
                      <span className="lugat-result-meaning">{lugatData[w]}</span>
                    </button>
                  ))
                ) : (
                  <div className="lugat-empty">
                    <p>Слово не найдено</p>
                  </div>
                )}
              </div>
            ) : selected ? (
              <div className="lugat-definition" style={{ animation: 'fadeInUp 0.25s ease' }} key={selected.word}>
                <div className="lugat-definition-header">
                  <span className="lugat-definition-label">Значение слова</span>
                  <h1 className="lugat-definition-word">{selected.word}</h1>
                </div>
                <div className="lugat-definition-body">
                  <p>{selected.meaning}</p>
                </div>
                <div className="lugat-definition-footer">
                  <p>Словарь (Lügat) содержит 4 449 терминов из трудов Бедиуззамана Саида Нурси.</p>
                </div>
              </div>
            ) : (
              <div className="lugat-empty-state h-full flex flex-col justify-center items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mb-4 text-[var(--border-color)]">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <p>Кликните по слову в тексте<br/>или воспользуйтесь поиском</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="lugat-footer mt-auto">
            <span>Powered by Liskin Labs</span>
          </div>
        </div>
      </aside>
    </>
  );
};
