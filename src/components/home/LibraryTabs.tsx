import React, { useState, useEffect } from 'react';

interface Book {
  id: string;
  title: string;
  book: string;
  lang: string;
  category?: string;
  order?: number;
}

interface Props {
  library: Record<string, Book[]>;
}

const CATEGORIES = [
  { id: 'main', label: 'Основная коллекция', icon: '📚', subtitle: 'Büyük Kitaplar' },
  { id: 'small', label: 'Малые рисале', icon: '📖', subtitle: 'Küçük Kitaplar' },
  { id: 'prayers', label: 'Молитвы и азкары', icon: '🤲', subtitle: 'Evrad & Ezkâr' },
  { id: 'other', label: 'Другие книги', icon: '📑', subtitle: 'Diğer Kitaplar' },
];

const LANGUAGE_META: Record<string, { label: string, icon: string }> = {
  tr: { label: 'Türkçe', icon: '🇹🇷' },
  en: { label: 'English', icon: '🇺🇸' },
  ar: { label: 'العربية', icon: '🇸🇦' },
  ru: { label: 'Русский', icon: '🇷🇺' },
  kz: { label: 'Қазақша', icon: '🇰🇿' },
  uz: { label: 'Oʻzbekcha', icon: '🇺🇿' },
  de: { label: 'Deutsch', icon: '🇩🇪' },
  es: { label: 'Español', icon: '🇪🇸' },
  fa: { label: 'فارسی', icon: '🇮🇷' },
  os: { label: 'Османский', icon: '📜' },
  ur: { label: 'Урду', icon: '🇵🇰' },
};

export const LibraryTabs = ({ library }: Props) => {
  const availableLangs = Object.keys(library);
  
  // Set default tab to 'ru' if available, otherwise 'tr', otherwise the first available
  const defaultTab = availableLangs.includes('ru') ? 'ru' : (availableLangs.includes('tr') ? 'tr' : availableLangs[0]);
  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  const currentBooks = library[activeTab] || [];

  const renderBookRow = (book: Book) => (
    <a 
      key={book.id}
      href={`${import.meta.env.BASE_URL}book/${book.id}`} 
      className="group relative flex flex-col justify-between p-0 overflow-hidden rounded-[4px] border border-slate-200/20 dark:border-slate-700/20 aspect-[1/1.5] book-cover-3d cursor-pointer"
      style={{ fontFamily: 'var(--font-inter)' }}
    >
      {/* Background Gradient & Texture */}
      <div className={`absolute inset-0 z-0 bg-gradient-to-br opacity-95 transition-opacity duration-500 group-hover:opacity-100 ${
         book.category === 'main' ? 'from-amber-700 via-amber-800 to-amber-950' :
         book.category === 'small' ? 'from-emerald-700 via-emerald-800 to-emerald-950' :
         book.category === 'prayers' ? 'from-sky-700 via-sky-800 to-slate-900' :
         'from-slate-600 via-slate-700 to-slate-900'
      }`} />
      
      {/* Cover content */}
      <div className="relative z-20 flex flex-col h-full ml-5 p-5">
        <div className="flex justify-between items-start mb-auto">
          <div className="px-2.5 py-1 bg-black/20 backdrop-blur-md rounded-full border border-white/10 text-[9px] font-bold text-white shadow-sm flex items-center gap-1.5 uppercase tracking-widest">
            <span className="opacity-80">{LANGUAGE_META[activeTab]?.icon || ''}</span>
            <span>{activeTab}</span>
          </div>
        </div>
        
        <div className="mt-auto pb-2 flex flex-col justify-end h-full">
          {/* Decorative graphic element (abstract) */}
          <div className="w-12 h-12 rounded-full border border-white/20 mb-6 flex items-center justify-center bg-gradient-to-tr from-white/5 to-transparent shadow-inner">
             <span className="text-xl font-black text-white/50" style={{ fontFamily: 'var(--reader-font, var(--font-literata))' }}>
                {book.title.substring(0, 1)}
             </span>
          </div>
          
          <h4 className="text-[1.35rem] font-bold text-white leading-tight mb-2 drop-shadow-md group-hover:text-amber-100 transition-colors" style={{ fontFamily: 'var(--reader-font, var(--font-literata))', fontStyle: 'italic' }}>
            {book.title}
          </h4>
          <p className="text-[10px] text-white/60 font-semibold tracking-widest uppercase">
            {CATEGORIES.find(c => c.id === book.category)?.label || 'Рисале-и Нур'}
          </p>
        </div>
      </div>
    </a>
  );

  return (
    <div className="space-y-20">
      {/* Premium Segmented Controls (Language Tabs) */}
      <div className="flex justify-center">
        <div className="inline-flex items-center p-1.5 glass-panel rounded-[2rem]">
          {availableLangs.map((langKey) => {
            const meta = LANGUAGE_META[langKey] || { label: langKey.toUpperCase(), icon: '🌐' };
            const isActive = activeTab === langKey;
            return (
              <button
                key={langKey}
                onClick={() => setActiveTab(langKey)}
                className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? 'text-white shadow-lg scale-105'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-amber-500 rounded-full -z-10 shadow-[0_4px_12px_rgba(217,119,6,0.3)]"></div>
                )}
                <span className={`text-lg transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}>{meta.icon}</span>
                <span className="hidden sm:inline-block tracking-wide">{meta.label}</span>
                <span className="sm:hidden uppercase tracking-widest">{langKey}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Book Grids by Category */}
      <div className="space-y-24">
        {currentBooks.length > 0 ? (
          <>
            {CATEGORIES.map((cat) => {
              const booksInCat = currentBooks.filter(b => b.category === cat.id);
              if (booksInCat.length === 0) return null;
              return (
                <div key={cat.id} className="relative">
                  <div className="flex items-center gap-4 mb-10 pl-2 border-l-4 border-amber-500">
                    <div className="w-14 h-14 rounded-2xl glass-panel flex items-center justify-center shadow-sm">
                        <span className="text-2xl">{cat.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight" style={{ fontFamily: 'var(--font-inter)' }}>
                        {cat.label}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-wide mt-1 uppercase" style={{ fontFamily: 'var(--font-inter)' }}>
                        {cat.subtitle} • <span className="text-amber-600 dark:text-amber-500 font-bold">{booksInCat.length}</span> {booksInCat.length === 1 ? 'КНИГА' : booksInCat.length < 5 ? 'КНИГИ' : 'КНИГ'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-8 gap-y-12 px-2 pb-8">
                    {booksInCat.map(renderBookRow)}
                  </div>
                </div>
              );
            })}
            
            {/* Show "Other" items that don't match known categories just in case */}
            {currentBooks.filter(b => !CATEGORIES.find(c => c.id === b.category)).length > 0 && (
              <div key="unmatched" className="relative">
                  <div className="flex items-center gap-4 mb-10 pl-2 border-l-4 border-slate-400">
                    <div className="w-14 h-14 rounded-2xl glass-panel flex items-center justify-center shadow-sm">
                        <span className="text-2xl">📁</span>
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight" style={{ fontFamily: 'var(--font-inter)' }}>
                        Прочее
                      </h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-8 gap-y-12 px-2 pb-8">
                    {currentBooks.filter(b => !CATEGORIES.find(c => c.id === b.category)).map(renderBookRow)}
                  </div>
              </div>
            )}
          </>
        ) : (
          <div className="col-span-full py-32 text-center glass-panel rounded-3xl max-w-2xl mx-auto">
            <div className="text-6xl mb-6 opacity-80">📭</div>
            <h3 className="text-2xl font-black text-slate-700 dark:text-slate-200 mb-2" style={{ fontFamily: 'var(--font-inter)' }}>Ничего не найдено</h3>
            <p className="text-slate-500 font-medium tracking-wide">В этом языковом разделе пока нет доступных книг.</p>
          </div>
        )}
      </div>
    </div>
  );
};
