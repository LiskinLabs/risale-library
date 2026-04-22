import { useStore } from '@nanostores/react';
import { lastReadBook, bookmarks, readingProgress } from '../../stores/readerStore';

export const HomePersistence = () => {
  const lastBookSlug = useStore(lastReadBook);
  const favoriteBooks = useStore(bookmarks);
  const progress = useStore(readingProgress);

  if (!lastBookSlug && favoriteBooks.length === 0) return null;

  return (
    <div className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Continue Reading Card */}
      {lastBookSlug && (
        <div className="bg-amber-600 rounded-3xl p-8 text-white shadow-xl shadow-amber-600/20 flex flex-col justify-between group">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">Продолжить чтение</span>
            <h3 className="text-3xl font-black mt-2 mb-4 group-hover:translate-x-1 transition-transform uppercase">
              {lastBookSlug.replace(/-/g, ' ')}
            </h3>
            <div className="w-full bg-white/20 rounded-full h-1.5 mb-2">
              <div 
                className="bg-white h-full rounded-full transition-all duration-1000" 
                style={{ width: `${Math.round(Number(progress[lastBookSlug] || 0) * 100)}%` }}
              ></div>
            </div>
            <span className="text-[10px] font-mono opacity-80">Прогресс: {Math.round(Number(progress[lastBookSlug] || 0) * 100)}%</span>
          </div>
          
          <a 
            href={`${import.meta.env.BASE_URL}book/${lastBookSlug}`}
            className="mt-8 bg-white text-amber-600 font-bold py-3 px-6 rounded-xl text-center hover:bg-amber-50 transition-colors inline-block"
          >
            Открыть книгу
          </a>
        </div>
      )}

      {/* Bookmarks List */}
      {favoriteBooks.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            Избранное
          </h3>
          <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin">
            {favoriteBooks.map((b) => (
              <a 
                key={b.slug + (b.hash || '')}
                href={`${import.meta.env.BASE_URL}book/${b.slug}${b.hash ? '#' + b.hash : ''}`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 group"
              >
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-amber-600">{b.title}</span>
                <span className="text-[9px] text-slate-400 font-mono">
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
