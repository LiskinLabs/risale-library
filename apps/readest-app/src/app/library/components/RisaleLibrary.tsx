import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import { Book } from '@/types/book';
import { PiCaretDownBold, PiCaretUpBold, PiBookOpenBold } from 'react-icons/pi';
import BookshelfItem from './BookshelfItem';

interface Shelf {
  id: number;
  main: string;
  title: string;
  books: string[];
}

interface RisaleLibraryProps {
  libraryBooks: Book[];
  shelves: Shelf[];
  handleShowDetailsBook: (book: Book) => void;
}

const RisaleLibrary: React.FC<RisaleLibraryProps> = ({
  libraryBooks = [],
  shelves = [],
  handleShowDetailsBook,
}) => {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (title: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const mainCategories = useMemo(() => {
    const groups: Record<string, Shelf[]> = {};
    if (!shelves) return groups;
    shelves.forEach((shelf) => {
      const mainCat = shelf.main;
      if (!mainCat) return;
      if (!groups[mainCat]) groups[mainCat] = [];
      groups[mainCat]!.push(shelf);
    });
    return groups;
  }, [shelves]);

  const findBookByUrl = (url: string) => {
    if (!url || !libraryBooks) return null;
    try {
      const parts = url.split('/');
      const filenameWithExt = parts[parts.length - 1];
      if (!filenameWithExt) return null;
      const filename = decodeURIComponent(filenameWithExt).replace('.md', '');

      // Try to find book by various metadata fields
      return libraryBooks.find(
        (b) =>
          (b.title && b.title.toLowerCase().includes(filename.toLowerCase())) ||
          (b.hash && b.hash.includes(filename)),
      );
    } catch (_e) {
      return null;
    }
  };

  if (!libraryBooks || libraryBooks.length === 0) {
    return (
      <div className='flex h-full flex-col items-center justify-center opacity-50'>
        <div className='loading loading-spinner loading-lg mb-4'></div>
        <p>Загрузка библиотеки...</p>
      </div>
    );
  }

  return (
    <div className='risale-library-container bg-base-200/30 h-full space-y-12 overflow-y-auto p-6'>
      {Object.entries(mainCategories).map(([mainTitle, subShelves]) => (
        <section key={mainTitle} className='main-category'>
          <div className='bg-base-200/80 border-primary/20 sticky top-0 z-10 mb-6 border-b py-2 backdrop-blur-md'>
            <h2 className='text-primary flex items-center gap-3 text-2xl font-black uppercase tracking-wider'>
              <PiBookOpenBold />
              {mainTitle}
            </h2>
          </div>

          <div className='space-y-6'>
            {subShelves.map((shelf) => {
              const isCollapsed = collapsedGroups[shelf.title];
              const shelfBooks = (shelf.books || [])
                .map((url) => findBookByUrl(url))
                .filter((b): b is Book => b !== null);

              if (shelfBooks.length === 0) return null;

              return (
                <div
                  key={shelf.title}
                  className='shelf-group bg-base-100 border-base-300 overflow-hidden rounded-2xl border shadow-xl'
                >
                  <button
                    onClick={() => toggleGroup(shelf.title)}
                    className='hover:bg-primary/5 group flex w-full items-center justify-between p-5 transition-all'
                  >
                    <div className='flex items-center gap-4'>
                      <div className='bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full transition-transform group-hover:scale-110'>
                        {shelfBooks.length}
                      </div>
                      <span className='text-xl font-bold'>{shelf.title}</span>
                    </div>
                    <div className='text-2xl opacity-40'>
                      {isCollapsed ? <PiCaretDownBold /> : <PiCaretUpBold />}
                    </div>
                  </button>

                  <div
                    className={clsx(
                      'to-base-200/20 grid gap-6 bg-gradient-to-b from-transparent p-6',
                      isCollapsed
                        ? 'hidden'
                        : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7',
                    )}
                  >
                    {shelfBooks.map((book) => (
                      <div key={book.hash} className='flex flex-col items-center'>
                        <div className='group relative aspect-[2/3] w-full overflow-hidden rounded-lg shadow-lg transition-all duration-300 hover:shadow-2xl'>
                          <BookshelfItem
                            item={book}
                            mode='grid'
                            coverFit='crop'
                            handleShowDetailsBook={handleShowDetailsBook}
                            isSelectMode={false}
                            itemSelected={false}
                            setLoading={() => {}}
                            toggleSelection={() => {}}
                            handleGroupBooks={() => {}}
                            handleBookUpload={async () => true}
                            handleBookDownload={async () => true}
                            handleBookDelete={async () => true}
                            handleSetSelectMode={() => {}}
                            handleLibraryNavigation={() => {}}
                            handleUpdateReadingStatus={async () => {}}
                            transferProgress={null}
                          />
                        </div>
                        <span className='mt-3 line-clamp-2 px-1 text-center text-sm font-medium'>
                          {book.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};

export default RisaleLibrary;
