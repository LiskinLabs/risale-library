import { useStore } from '@nanostores/react';
import { lastReadBook, bookmarks, readingProgress } from '../../stores/readerStore';

export const HomePersistence = () => {
  const lastBookSlug = useStore(lastReadBook);
  const favoriteBooks = useStore(bookmarks);
  const progress = useStore(readingProgress);

  if (!lastBookSlug && favoriteBooks.length === 0) return null;

  return (
    <div className='mb-16 grid grid-cols-1 gap-8 md:grid-cols-2'>
      {/* Continue Reading Card */}
      {lastBookSlug && (
        <div className='group flex flex-col justify-between rounded-3xl bg-amber-600 p-8 text-white shadow-xl shadow-amber-600/20'>
          <div>
            <span className='text-[10px] font-bold uppercase tracking-[0.2em] opacity-80'>
              Продолжить чтение
            </span>
            <h3 className='mb-4 mt-2 text-3xl font-black uppercase transition-transform group-hover:translate-x-1'>
              {lastBookSlug.replace(/-/g, ' ')}
            </h3>
            <div className='mb-2 h-1.5 w-full rounded-full bg-white/20'>
              <div
                className='h-full rounded-full bg-white transition-all duration-1000'
                style={{ width: `${Math.round(Number(progress[lastBookSlug] || 0) * 100)}%` }}
              ></div>
            </div>
            <span className='font-mono text-[10px] opacity-80'>
              Прогресс: {Math.round(Number(progress[lastBookSlug] || 0) * 100)}%
            </span>
          </div>

          <a
            href={`${import.meta.env.BASE_URL}book/${lastBookSlug}`}
            className='mt-8 inline-block rounded-xl bg-white px-6 py-3 text-center font-bold text-amber-600 transition-colors hover:bg-amber-50'
          >
            Открыть книгу
          </a>
        </div>
      )}

      {/* Bookmarks List */}
      {favoriteBooks.length > 0 && (
        <div className='rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
          <h3 className='mb-6 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-4 w-4 text-amber-500'
              fill='currentColor'
              viewBox='0 0 24 24'
            >
              <path d='M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z' />
            </svg>
            Избранное
          </h3>
          <div className='scrollbar-thin max-h-[200px] space-y-3 overflow-y-auto pr-2'>
            {favoriteBooks.map((b) => (
              <a
                key={b.slug + (b.hash || '')}
                href={`${import.meta.env.BASE_URL}book/${b.slug}${b.hash ? '#' + b.hash : ''}`}
                className='group flex items-center justify-between rounded-xl border border-transparent p-3 transition-all hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-800'
              >
                <span className='text-sm font-bold text-slate-700 group-hover:text-amber-600 dark:text-slate-200'>
                  {b.title}
                </span>
                <span className='font-mono text-[9px] text-slate-400'>
                  {new Date(b.date).toLocaleDateString()}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
