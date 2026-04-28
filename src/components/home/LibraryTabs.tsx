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

const LANGUAGE_META: Record<string, { label: string; icon: string }> = {
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
  const defaultTab = availableLangs.includes('ru')
    ? 'ru'
    : availableLangs.includes('tr')
      ? 'tr'
      : availableLangs[0];
  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  const currentBooks = library[activeTab] || [];

  const getCoverUrl = (book: Book, lang: string) => {
    const filename =
      book.title
        .replace(/'/g, '')
        .replace(/-/g, '_')
        .replace(/ /g, '_')
        .replace(/İ/g, 'I')
        .replace(/ı/g, 'i') + '.svg';
    return `${import.meta.env.BASE_URL}covers/${lang}/${filename}`;
  };

  const renderBookRow = (book: Book) => {
    const coverUrl = getCoverUrl(book, activeTab);

    return (
      <a
        key={book.id}
        href={`${import.meta.env.BASE_URL}book/${book.id}`}
        className='book-cover-3d group relative flex aspect-[1/1.5] cursor-pointer flex-col justify-between overflow-hidden rounded-[4px] border border-slate-200/20 p-0 dark:border-slate-700/20'
        style={{ fontFamily: 'var(--font-inter)' }}
      >
        {/* SVG Cover Image */}
        <img
          src={coverUrl}
          alt={book.title}
          className='absolute inset-0 z-10 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
          onError={(e) => {
            // Fallback if the specific SVG doesn't exist
            e.currentTarget.style.display = 'none';
          }}
        />

        {/* Fallback Background Gradient & Texture */}
        <div
          className={`absolute inset-0 z-0 bg-gradient-to-br opacity-95 transition-opacity duration-500 group-hover:opacity-100 ${
            book.category === 'main'
              ? 'from-amber-700 via-amber-800 to-amber-950'
              : book.category === 'small'
                ? 'from-emerald-700 via-emerald-800 to-emerald-950'
                : book.category === 'prayers'
                  ? 'from-sky-700 via-sky-800 to-slate-900'
                  : 'from-slate-600 via-slate-700 to-slate-900'
          }`}
        />

        {/* Cover content (Fallback) */}
        <div className='relative z-20 ml-5 flex h-full flex-col p-5'>
          <div className='mb-auto flex items-start justify-between'>
            <div className='flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-white shadow-sm backdrop-blur-md'>
              <span className='opacity-80'>{LANGUAGE_META[activeTab]?.icon || ''}</span>
              <span>{activeTab}</span>
            </div>
          </div>

          <div className='mt-auto flex h-full flex-col justify-end pb-2'>
            {/* Decorative graphic element (abstract) */}
            <div className='fallback-cover-element mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-gradient-to-tr from-white/5 to-transparent shadow-inner'>
              <span
                className='text-xl font-black text-white/50'
                style={{ fontFamily: 'var(--reader-font, var(--font-literata))' }}
              >
                {book.title.substring(0, 1)}
              </span>
            </div>

            <h4
              className='fallback-cover-element mb-2 text-[1.35rem] font-bold leading-tight text-white drop-shadow-md transition-colors group-hover:text-amber-100'
              style={{
                fontFamily: 'var(--reader-font, var(--font-literata))',
                fontStyle: 'italic',
              }}
            >
              {book.title}
            </h4>
            <p className='fallback-cover-element text-[10px] font-semibold uppercase tracking-widest text-white/60'>
              {CATEGORIES.find((c) => c.id === book.category)?.label || 'Рисале-и Нур'}
            </p>
          </div>
        </div>
      </a>
    );
  };

  return (
    <div className='space-y-20'>
      {/* Premium Segmented Controls (Language Tabs) */}
      <div className='flex justify-center'>
        <div className='glass-panel inline-flex items-center rounded-[2rem] p-1.5'>
          {availableLangs.map((langKey) => {
            const meta = LANGUAGE_META[langKey] || { label: langKey.toUpperCase(), icon: '🌐' };
            const isActive = activeTab === langKey;
            return (
              <button
                key={langKey}
                onClick={() => setActiveTab(langKey)}
                className={`relative flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? 'scale-105 text-white shadow-lg'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                {isActive && (
                  <div className='absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 shadow-[0_4px_12px_rgba(217,119,6,0.3)]'></div>
                )}
                <span
                  className={`text-lg transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}
                >
                  {meta.icon}
                </span>
                <span className='hidden tracking-wide sm:inline-block'>{meta.label}</span>
                <span className='uppercase tracking-widest sm:hidden'>{langKey}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Book Grids by Category */}
      <div className='space-y-24'>
        {currentBooks.length > 0 ? (
          <>
            {CATEGORIES.map((cat) => {
              const booksInCat = currentBooks.filter((b) => b.category === cat.id);
              if (booksInCat.length === 0) return null;
              return (
                <div key={cat.id} className='relative'>
                  <div className='mb-10 flex items-center gap-4 border-l-4 border-amber-500 pl-2'>
                    <div className='glass-panel flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm'>
                      <span className='text-2xl'>{cat.icon}</span>
                    </div>
                    <div>
                      <h3
                        className='text-3xl font-black tracking-tight text-slate-800 dark:text-white'
                        style={{ fontFamily: 'var(--font-inter)' }}
                      >
                        {cat.label}
                      </h3>
                      <p
                        className='mt-1 text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400'
                        style={{ fontFamily: 'var(--font-inter)' }}
                      >
                        {cat.subtitle} •{' '}
                        <span className='font-bold text-amber-600 dark:text-amber-500'>
                          {booksInCat.length}
                        </span>{' '}
                        {booksInCat.length === 1
                          ? 'КНИГА'
                          : booksInCat.length < 5
                            ? 'КНИГИ'
                            : 'КНИГ'}
                      </p>
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-x-8 gap-y-12 px-2 pb-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'>
                    {booksInCat.map(renderBookRow)}
                  </div>
                </div>
              );
            })}

            {/* Show "Other" items that don't match known categories just in case */}
            {currentBooks.filter((b) => !CATEGORIES.find((c) => c.id === b.category)).length >
              0 && (
              <div key='unmatched' className='relative'>
                <div className='mb-10 flex items-center gap-4 border-l-4 border-slate-400 pl-2'>
                  <div className='glass-panel flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm'>
                    <span className='text-2xl'>📁</span>
                  </div>
                  <div>
                    <h3
                      className='text-3xl font-black tracking-tight text-slate-800 dark:text-white'
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      Прочее
                    </h3>
                  </div>
                </div>
                <div className='grid grid-cols-2 gap-x-8 gap-y-12 px-2 pb-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'>
                  {currentBooks
                    .filter((b) => !CATEGORIES.find((c) => c.id === b.category))
                    .map(renderBookRow)}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className='glass-panel col-span-full mx-auto max-w-2xl rounded-3xl py-32 text-center'>
            <div className='mb-6 text-6xl opacity-80'>📭</div>
            <h3
              className='mb-2 text-2xl font-black text-slate-700 dark:text-slate-200'
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              Ничего не найдено
            </h3>
            <p className='font-medium tracking-wide text-slate-500'>
              В этом языковом разделе пока нет доступных книг.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
