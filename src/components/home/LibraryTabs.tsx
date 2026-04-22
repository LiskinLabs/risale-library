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
      className="group relative flex flex-col justify-between p-6 overflow-hidden rounded-r-2xl rounded-l-sm transition-all duration-300 hover:-translate-y-2 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] hover:shadow-2xl aspect-[2.5/3.5] border border-slate-200/50 dark:border-slate-700/50"
    >
      {/* Background Gradient & Texture */}
      <div className={`absolute inset-0 z-0 bg-gradient-to-br opacity-90 transition-opacity group-hover:opacity-100 ${
         book.category === 'main' ? 'from-amber-700 to-amber-950' :
         book.category === 'small' ? 'from-emerald-700 to-emerald-950' :
         book.category === 'prayers' ? 'from-blue-700 to-blue-950' :
         'from-slate-700 to-slate-950'
      }`} />
      
      {/* Stylized Book Binding (Spine) */}
      <div className="absolute left-0 top-0 bottom-0 w-5 bg-black/30 z-10 border-r border-white/10 shadow-[inset_-2px_0_4px_rgba(0,0,0,0.2)]" />
      <div className="absolute left-5 top-0 bottom-0 w-[1px] bg-white/20 z-10" />
      <div className="absolute left-6 top-0 bottom-0 w-[1px] bg-black/10 z-10" />
      
      {/* Cover content */}
      <div className="relative z-20 flex flex-col h-full ml-3">
        <div className="flex justify-between items-start">
          <div className="px-2 py-1 bg-white/10 backdrop-blur-md rounded border border-white/20 text-[9px] font-black text-white shadow-sm flex items-center gap-1">
            <span>{LANGUAGE_META[activeTab]?.icon || ''}</span>
            <span className="uppercase tracking-widest">{activeTab}</span>
          </div>
          <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-white/40 border border-white/20 backdrop-blur-sm bg-black/10 text-lg shadow-inner">
            {book.title.substring(0, 1)}
          </div>
        </div>
        
        <div className="mt-auto mb-6">
          <h4 className="text-2xl font-black text-white leading-tight mb-3 drop-shadow-md decoration-amber-400 decoration-2 underline-offset-4 group-hover:underline transition-all font-reader">
            {book.title}
          </h4>
          <p className="text-xs text-white/70 font-medium tracking-wider uppercase">
            {CATEGORIES.find(c => c.id === book.category)?.label || 'Рисале-и Нур'}
          </p>
        </div>

        <div className="flex items-center justify-between text-white/80 group-hover:text-white transition-colors border-t border-white/10 pt-4 mt-2">
          <span className="text-[10px] font-bold uppercase tracking-widest">Читать</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </div>
      </div>
    </a>
  );

  return (
    <div className="space-y-12">
      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-2xl max-w-4xl mx-auto">
        {availableLangs.map((langKey) => {
          const meta = LANGUAGE_META[langKey] || { label: langKey.toUpperCase(), icon: '🌐' };
          return (
            <button
              key={langKey}
              onClick={() => setActiveTab(langKey)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === langKey
                  ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <span className="text-lg">{meta.icon}</span>
              <span className="hidden sm:inline-block">{meta.label}</span>
              <span className="sm:hidden uppercase">{langKey}</span>
            </button>
          );
        })}
      </div>

      {/* Book Grids by Category */}
      <div className="space-y-16">
        {currentBooks.length > 0 ? (
          <>
            {CATEGORIES.map((cat) => {
              const booksInCat = currentBooks.filter(b => b.category === cat.id);
              if (booksInCat.length === 0) return null;
              return (
                <div key={cat.id}>
                  <div className="flex items-center gap-3 mb-8">
                    <span className="text-3xl">{cat.icon}</span>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                        {cat.label}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium tracking-wide">
                        {cat.subtitle} • {booksInCat.length} {booksInCat.length === 1 ? 'книга' : booksInCat.length < 5 ? 'книги' : 'книг'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {booksInCat.map(renderBookRow)}
                  </div>
                </div>
              );
            })}
            
            {/* Show "Other" items that don't match known categories just in case */}
            {currentBooks.filter(b => !CATEGORIES.find(c => c.id === b.category)).length > 0 && (
              <div key="unmatched">
                  <div className="flex items-center gap-3 mb-8">
                    <span className="text-3xl">📁</span>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                        Прочее
                      </h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {currentBooks.filter(b => !CATEGORIES.find(c => c.id === b.category)).map(renderBookRow)}
                  </div>
              </div>
            )}
          </>
        ) : (
          <div className="col-span-full py-20 text-center">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">В этом разделе пока нет книг</p>
          </div>
        )}
      </div>
    </div>
  );
};
