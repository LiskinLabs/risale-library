import React, { useEffect, useState, useMemo } from 'react';
import {
  PiCaretDownBold,
  PiCaretUpBold,
  PiFolderOpenFill,
  PiEyeFill,
  PiEyeSlashFill,
  PiBookFill,
  PiStarFill,
  PiPlusBold,
} from 'react-icons/pi';
import { useEnv } from '@/context/EnvContext';
import { useAppRouter } from '@/hooks/useAppRouter';
import { navigateToReader } from '@/utils/nav';
import { Book } from '@/types/book';

import { useLibraryStore } from '@/store/libraryStore';

interface CatalogBook {
  title: string;
  lang: string;
  main: string;
  shelf: string;
  url: string;
  cover: string;
}

interface RisaleCatalogProps {
  userBooks: Book[];
  onImportClick: () => void;
}

const RisaleCatalog: React.FC<RisaleCatalogProps> = ({ userBooks, onImportClick }) => {
  const [catalog, setCatalog] = useState<CatalogBook[]>([]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const { appService, envConfig } = useEnv();
  const { updateBooks } = useLibraryStore();
  const router = useAppRouter();
  const [loadingBook, setLoadingBook] = useState<string | null>(null);

  useEffect(() => {
    fetch('/catalog.json')
      .then((res) => res.json())
      .then((data) => setCatalog(data))
      .catch((err) => console.error('Catalog load error:', err));
  }, []);

  const grouped = useMemo(() => {
    const groups: Record<string, Record<string, CatalogBook[]>> = {};
    catalog.forEach((book) => {
      const mainCat = book.main || 'Прочее';
      const shelfTitle = book.shelf || 'Разное';
      if (!groups[mainCat]) groups[mainCat] = {};
      if (!groups[mainCat][shelfTitle]) groups[mainCat][shelfTitle] = [];
      groups[mainCat][shelfTitle].push(book);
    });
    return groups;
  }, [catalog]);

  const handleOpenBook = async (book: CatalogBook) => {
    if (!appService) return;
    setLoadingBook(book.url);
    try {
      // Пытаемся получить оглавление из метаданных
      let bookIndex: { title: string; page: string }[] | undefined;
      try {
        const metaRes = await fetch('/metadata.json');
        const metadata = await metaRes.json();

        // Извлекаем ID книги из URL
        const filename = book.url.split('/').pop()?.replace('.md', '') || '';

        // Пробуем несколько вариантов ключей (ru_mektubat, mektubat, ar_ar_sozler, sozler)
        const possibleKeys = [
          filename,
          filename.replace(/^[a-z]{2}_/, ''), // ru_mektubat -> mektubat
          filename.replace(/^([a-z]{2})_([a-z]{2})_/, ''), // ar_ar_sozler -> sozler
          filename.split('_').pop() || '', // last resort
        ];

        for (const key of possibleKeys) {
          if (metadata.books && metadata.books[key]) {
            bookIndex = metadata.books[key].index;
            console.log(`Found TOC for book using key: ${key}`);
            break;
          }
        }
      } catch (e) {
        console.warn('Failed to load book index from metadata:', e);
      }

      // ИСПОЛЬЗУЕМ ОРИГИНАЛЬНЫЙ НАДЕЖНЫЙ МЕТОД
      const imported = await appService.importBook(book.url, userBooks, {
        saveBook: true,
        index: bookIndex,
      });
      if (imported) {
        // Помечаем книгу как принадлежащую каталогу, чтобы она не дублировалась в "Ваших книгах"
        imported.groupId = 'internal-catalog';
        imported.url = book.url;
        if (!imported.coverImageUrl && book.cover) {
          imported.coverImageUrl = book.cover;
        }

        await updateBooks(envConfig, [imported]);
        navigateToReader(router, [imported.hash]);
      }
    } catch (err) {
      console.error('Failed to open book:', err);
      alert('Ошибка: не удалось загрузить текст книги.');
    } finally {
      setLoadingBook(null);
    }
  };

  const toggleAll = (collapse: boolean) => {
    const newState: Record<string, boolean> = {};
    if (collapse) {
      catalog.forEach((b) => (newState[b.shelf] = true));
    }
    setCollapsed(newState);
  };

  // Фильтруем список пользовательских книг, исключая те, что были открыты из встроенного каталога
  const filteredUserBooks = useMemo(() => {
    return userBooks.filter((book) => book.groupId !== 'internal-catalog');
  }, [userBooks]);

  if (catalog.length === 0) return null;

  return (
    <div className='paper-texture scrollbar-thin flex-grow space-y-32 overflow-y-auto p-6 pb-32 sm:p-12'>
      {/* PREMIUM HERO SECTION */}
      <div className='premium-glass reveal-step relative w-full overflow-hidden rounded-[3rem] px-8 py-20'>
        <div className='bg-premium-gold/10 absolute right-0 top-0 h-96 w-96 -translate-y-1/2 translate-x-1/2 rounded-full blur-[100px]' />
        <div className='bg-premium-emerald/5 absolute bottom-0 left-0 h-64 w-64 -translate-x-1/2 translate-y-1/2 rounded-full blur-[80px]' />

        <div className='relative z-10 mx-auto flex max-w-7xl flex-col items-center justify-between gap-16 md:flex-row'>
          <div className='flex-1 space-y-8 text-center md:text-left'>
            <span
              className='bg-premium-gold/10 text-premium-gold reveal-step inline-block rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em]'
              style={{ animationDelay: '0.1s' }}
            >
              NurSpace Ecosystem
            </span>
            <h1
              className='shelf-title text-base-content reveal-step text-6xl font-light leading-tight tracking-tighter md:text-8xl'
              style={{ animationDelay: '0.2s' }}
            >
              Nur<span className='text-premium-gold font-serif italic'>Space</span>
            </h1>
            <p
              className='book-title text-base-content/60 reveal-step max-w-xl text-xl leading-relaxed'
              style={{ animationDelay: '0.3s' }}
            >
              Безупречная цифровая библиотека для глубокого изучения наследия Саида Нурси.
            </p>
            <div className='reveal-step pt-4' style={{ animationDelay: '0.4s' }}>
              <button
                onClick={onImportClick}
                className='btn btn-lg bg-premium-gold hover:bg-premium-gold/80 shadow-premium-gold/20 premium-transition rounded-full border-none px-10 text-white shadow-xl'
              >
                Открыть библиотеку
              </button>
            </div>
          </div>

          <div
            className='reveal-step relative hidden flex-1 md:block'
            style={{ animationDelay: '0.5s' }}
          >
            {/* CSS-Only Visual: Dynamic Particles (NUR) */}
            <div className='absolute inset-0 z-0'>
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className='nur-particle'
                  style={{
                    width: Math.random() * 80 + 40 + 'px',
                    height: Math.random() * 80 + 40 + 'px',
                    left: Math.random() * 100 + '%',
                    top: Math.random() * 100 + '%',
                    animationDelay: Math.random() * 5 + 's',
                    animationDuration: Math.random() * 15 + 10 + 's',
                  }}
                />
              ))}
            </div>

            {/* CSS-Only Visual: 3D Animated Book (FIXED) */}
            <div className='book-3d-container relative z-10 mx-auto h-[450px] w-72'>
              <div className='book-3d-object relative h-full w-full'>
                {/* Front Cover */}
                <div className='border-premium-gold/20 absolute inset-0 z-20 overflow-hidden rounded-r-lg border-l-[4px] bg-[#0c1222] shadow-2xl'>
                  <div className='paper-texture absolute inset-0 opacity-10' />
                  <div className='flex h-full flex-col items-center justify-between p-12 text-center'>
                    <div className='bg-premium-gold/30 h-px w-16' />
                    <div className='space-y-4'>
                      <h3 className='gold-foil text-2xl font-light uppercase tracking-[0.3em] opacity-80'>
                        Risale-i
                      </h3>
                      <h2 className='gold-foil font-serif text-6xl italic'>Nur</h2>
                      <div className='bg-premium-gold/20 mx-auto h-px w-8' />
                      <p className='text-premium-gold/40 text-[10px] uppercase tracking-[0.4em]'>
                        Digital Space
                      </p>
                    </div>
                    <div className='bg-premium-gold/30 h-px w-16' />
                  </div>
                </div>
                {/* Spine (Fixed position) */}
                <div className='book-side z-10' />
                {/* Page Edge (Visual Shimmer) */}
                <div className='page-edge z-0' />
                {/* Ambient Shadow */}
                <div className='absolute inset-0 -z-10 -translate-x-8 translate-y-16 scale-95 rounded-full bg-black/40 opacity-50 blur-[60px]' />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className='reveal-step sticky top-4 z-40 flex justify-end gap-3'
        style={{ animationDelay: '0.6s' }}
      >
        <button
          onClick={() => toggleAll(false)}
          className='btn btn-sm btn-ghost border-premium-gold/20 premium-transition hover:border-premium-gold rounded-full border bg-white/80 shadow-sm backdrop-blur-md dark:bg-black/40'
        >
          <PiEyeFill className='text-premium-gold' />{' '}
          <span className='text-[10px] font-bold uppercase tracking-widest'>Развернуть</span>
        </button>
        <button
          onClick={() => toggleAll(true)}
          className='btn btn-sm btn-ghost border-base-300/50 premium-transition rounded-full border bg-white/80 shadow-sm backdrop-blur-md dark:bg-black/40'
        >
          <PiEyeSlashFill className='opacity-50' />{' '}
          <span className='text-[10px] font-bold uppercase tracking-widest opacity-50'>
            Свернуть
          </span>
        </button>
      </div>

      {/* РАЗДЕЛ: ВАШИ КНИГИ */}
      <div className='space-y-10'>
        <div className='border-premium-gold/10 flex items-center gap-4 border-b pb-4'>
          <PiFolderOpenFill className='text-premium-gold text-3xl' />
          <h2 className='shelf-title text-base-content/90 text-4xl font-light uppercase tracking-[0.2em]'>
            Личная полка
          </h2>
        </div>

        <div className='grid grid-cols-2 gap-12 px-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7'>
          {/* Кнопка добавления */}
          <div
            onClick={onImportClick}
            className='border-premium-gold/30 hover:border-premium-gold hover:bg-premium-gold/5 premium-transition group flex aspect-[3/4.5] cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border border-dashed'
          >
            <div className='border-premium-gold/20 premium-transition flex h-12 w-12 items-center justify-center rounded-full border group-hover:scale-110'>
              <PiPlusBold className='text-premium-gold/40 group-hover:text-premium-gold text-xl' />
            </div>
            <span className='text-[10px] font-bold uppercase tracking-[0.1em] opacity-40 group-hover:opacity-100'>
              Новая книга
            </span>
          </div>

          {filteredUserBooks.map((book) => (
            <div
              key={book.hash}
              onClick={() => navigateToReader(router, [book.hash])}
              className='group flex cursor-pointer flex-col items-center gap-5'
            >
              <div className='premium-transition hover-glow relative aspect-[3/4.5] w-full overflow-hidden rounded-sm shadow-2xl group-hover:-translate-y-2'>
                <img
                  src={book.coverImageUrl || book.metadata?.coverImageUrl || '/covers/default.png'}
                  className='h-full w-full object-cover'
                  onError={(e) => (e.currentTarget.src = '/covers/default.png')}
                  alt={book.title}
                />
                <div className='absolute right-3 top-3'>
                  <PiStarFill className='text-premium-gold drop-shadow-md' />
                </div>
                <div className='premium-transition absolute inset-0 bg-black/0 group-hover:bg-black/5' />
              </div>
              <span className='book-title group-hover:text-premium-gold premium-transition line-clamp-2 text-center text-sm font-medium leading-relaxed opacity-80'>
                {book.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ОСНОВНОЙ КАТАЛОГ */}
      {Object.entries(grouped).map(([main, shelves]) => (
        <div key={main} className='space-y-12'>
          <div className='border-base-content/5 flex items-center gap-4 border-b pb-4'>
            <PiBookFill className='text-3xl opacity-20' />
            <h2 className='shelf-title text-base-content/60 text-4xl font-light uppercase tracking-[0.2em]'>
              {main}
            </h2>
          </div>

          <div className='space-y-16'>
            {Object.entries(shelves).map(([shelfTitle, books]) => (
              <div key={shelfTitle} className='space-y-8'>
                <button
                  onClick={() => setCollapsed((p) => ({ ...p, [shelfTitle]: !p[shelfTitle] }))}
                  className='premium-transition group flex items-center gap-4 hover:gap-6'
                >
                  <span className='shelf-title text-base-content/80 group-hover:text-premium-gold text-2xl font-light uppercase tracking-widest'>
                    {shelfTitle}
                  </span>
                  <div className='bg-base-content/5 group-hover:bg-premium-gold/20 premium-transition h-px flex-grow' />
                  <div className='premium-transition text-xs font-bold uppercase tracking-tighter opacity-30 group-hover:opacity-100'>
                    {books.length} {collapsed[shelfTitle] ? 'Показать' : 'Скрыть'}
                  </div>
                </button>

                {!collapsed[shelfTitle] && (
                  <div className='grid grid-cols-2 gap-12 px-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7'>
                    {books.map((book) => (
                      <div
                        key={book.url}
                        onClick={() => handleOpenBook(book)}
                        className='group flex cursor-pointer flex-col items-center gap-5'
                      >
                        <div className='premium-transition hover-glow border-base-content/5 relative aspect-[3/4.5] w-full overflow-hidden rounded-sm border shadow-2xl group-hover:-translate-y-2'>
                          <img
                            src={book.cover}
                            alt={book.title}
                            className='h-full w-full object-cover'
                            loading='lazy'
                            onError={(e) => (e.currentTarget.src = '/covers/default.png')}
                          />
                          {loadingBook === book.url && (
                            <div className='absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px] dark:bg-black/60'>
                              <div className='loading loading-spinner text-premium-gold'></div>
                            </div>
                          )}
                          <div className='bg-premium-gold/0 group-hover:bg-premium-gold/5 premium-transition absolute inset-0 flex items-center justify-center'>
                            <div className='premium-transition flex h-12 w-12 scale-90 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-2xl group-hover:scale-100 group-hover:opacity-100 dark:bg-black/90'>
                              <div className='text-premium-gold translate-x-0.5'>▶</div>
                            </div>
                          </div>
                        </div>
                        <span className='book-title group-hover:text-premium-gold premium-transition line-clamp-2 text-center text-sm font-medium uppercase leading-relaxed tracking-tight opacity-70'>
                          {book.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RisaleCatalog;
