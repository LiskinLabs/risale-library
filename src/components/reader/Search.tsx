import React, { useState, useEffect } from 'react';

export const Search = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Open on Ctrl+K
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Lazy load Pagefind UI only when opened
      const initPagefind = async () => {
        // @ts-ignore
        if (typeof PagefindUI === 'undefined') {
          const script = document.createElement('script');
          script.src = `${import.meta.env.BASE_URL}pagefind/pagefind-ui.js`;
          script.onload = () => {
            // @ts-ignore
            new PagefindUI({
              element: "#search-modal-container",
              showSubResults: true,
              translations: {
                placeholder: "Поиск по всей библиотеке...",
                clear_search: "Очистить",
                load_more: "Показать еще",
                search_label: "Поиск",
                filters_label: "Фильтры",
                zero_results: "Ничего не найдено для [SEARCH_TERM]",
                many_results: "Найдено [COUNT] совпадений для [SEARCH_TERM]",
                one_result: "Найдено 1 совпадение для [SEARCH_TERM]",
                alt_search: "Ничего не найдено для [SEARCH_TERM]. Показаны результаты для [DIFFERENT_TERM]",
                search_suggestion: "Возможно, вы имели в виду [DIFFERENT_TERM]?",
                searching: "Поиск..."
              }
            });
          };
          document.head.appendChild(script);

          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = `${import.meta.env.BASE_URL}pagefind/pagefind-ui.css`;
          document.head.appendChild(link);
        }
      };
      initPagefind();
    }
  }, [isOpen]);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:border-amber-500 transition-all group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="text-xs font-bold hidden sm:block uppercase tracking-widest">Поиск</span>
        <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 font-sans text-[10px] font-medium text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md">
          <span className="text-xs">Ctrl</span>K
        </kbd>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 backdrop-blur-sm bg-slate-900/60 transition-opacity">
          <div className="absolute inset-0" onClick={() => setIsOpen(false)}></div>
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 max-h-[70vh] overflow-y-auto">
            <div id="search-modal-container" className="pagefind-custom"></div>
          </div>
        </div>
      )}

      <style>{`
        .pagefind-custom {
          --pagefind-ui-primary: #d97706; /* amber-600 */
          --pagefind-ui-text: #1e293b; /* slate-800 */
          --pagefind-ui-background: transparent;
          --pagefind-ui-border: #e2e8f0;
          --pagefind-ui-tag: #d97706;
          --pagefind-ui-font: inherit;
        }
        .dark .pagefind-custom {
          --pagefind-ui-text: #f1f5f9;
          --pagefind-ui-border: #334155;
        }
        .pagefind-ui__search-input {
          border-radius: 1rem !important;
          background-color: transparent !important;
          font-weight: bold !important;
        }
        .pagefind-ui__result {
          border-bottom: 1px solid #e2e8f0 !important;
          padding: 1.5rem 0 !important;
        }
        .dark .pagefind-ui__result {
          border-bottom-color: #1e293b !important;
        }
        .pagefind-ui__result-title {
          font-weight: 900 !important;
          color: #d97706 !important;
          text-transform: uppercase !important;
          letter-spacing: -0.025em !important;
        }
        .pagefind-ui__result-excerpt {
          font-family: 'Georgia', serif !important;
          font-size: 0.9rem !important;
          line-height: 1.6 !important;
          color: #64748b !important;
        }
        .dark .pagefind-ui__result-excerpt {
          color: #94a3b8 !important;
        }
        mark {
          background-color: #fef3c7 !important;
          color: #b45309 !important;
          padding: 0 0.1rem !important;
          border-radius: 0.2rem !important;
        }
        .dark mark {
          background-color: #78350f !important;
          color: #fcd34d !important;
        }
      `}</style>
    </>
  );
};
