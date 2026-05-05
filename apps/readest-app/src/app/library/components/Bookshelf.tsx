import clsx from 'clsx';
import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PiPlus } from 'react-icons/pi';
import { Book, ReadingStatus } from '@/types/book';
import {
  LibraryCoverFitType,
  LibraryViewModeType,
} from '@/types/settings';
import { useEnv } from '@/context/EnvContext';
import { useThemeStore } from '@/store/themeStore';
import { useAutoFocus } from '@/hooks/useAutoFocus';
import { useSettingsStore } from '@/store/settingsStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useTranslation } from '@/hooks/useTranslation';
import { navigateToReader } from '@/utils/nav';
import {
  createBookFilter,
  createBookSorter,
  ensureLibrarySortByType,
} from '../utils/libraryUtils';

import { useSpatialNavigation } from '../hooks/useSpatialNavigation';
import Alert from '@/components/Alert';
import Spinner from '@/components/Spinner';
import BookshelfItem from './BookshelfItem';
import SelectModeActions from './SelectModeActions';
import GroupingModal from './GroupingModal';
import SetStatusAlert from './SetStatusAlert';

interface BookshelfProps {
  libraryBooks: Book[];
  isSelectMode: boolean;
  isSelectAll: boolean;
  isSelectNone: boolean;
  onScrollerRef: (el: HTMLDivElement | null) => void;
  handleImportBooks: () => void;
  handleBookDownload: (
    book: Book,
    options?: { redownload?: boolean; queued?: boolean },
  ) => Promise<boolean>;
  handleBookUpload: (book: Book, syncBooks?: boolean) => Promise<boolean>;
  handleBookDelete: (book: Book, syncBooks?: boolean) => Promise<boolean>;
  handleSetSelectMode: (selectMode: boolean) => void;
  handleShowDetailsBook: (book: Book) => void;
  handleLibraryNavigation: (targetGroup: string) => void;
  handlePushLibrary: () => Promise<void>;
  booksTransferProgress: { [key: string]: number | null };
}

const BOOKSHELF_GRID_CLASSES =
  'bookshelf-items transform-wrapper grid gap-x-4 px-4 sm:gap-x-0 sm:px-2 ' +
  'grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10';

const Bookshelf: React.FC<BookshelfProps> = ({
  libraryBooks,
  isSelectMode,
  isSelectAll,
  isSelectNone,
  onScrollerRef,
  handleImportBooks,
  handleBookUpload,
  handleBookDownload,
  handleBookDelete,
  handleSetSelectMode,
  handleShowDetailsBook,
  handleLibraryNavigation,
  handlePushLibrary,
  booksTransferProgress,
}) => {
  const _ = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { envConfig } = useEnv();
  const { settings } = useSettingsStore();
  const { safeAreaInsets } = useThemeStore();

  const queryTerm = searchParams?.get('q') || null;
  const viewMode = searchParams?.get('view') || 'grid';
  const sortBy = ensureLibrarySortByType(searchParams?.get('sort'), settings.librarySortBy);
  const sortOrder = searchParams?.get('order') || (settings.librarySortAscending ? 'asc' : 'desc');
  const coverFit = searchParams?.get('cover') || settings.libraryCoverFit;

  const [loading, setLoading] = useState(false);
  const [showSelectModeActions, setShowSelectModeActions] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showStatusAlert, setShowStatusAlert] = useState(false);
  const [showGroupingModal, setShowGroupingModal] = useState(false);

  const abortDeletionRef = useRef(false);
  const autofocusRef = useAutoFocus<HTMLDivElement>();
  useSpatialNavigation(autofocusRef);

  const { setSelectedBooks, getSelectedBooks, toggleSelectedBook, updateBooks } = useLibraryStore();

  const uiLanguage = typeof localStorage !== 'undefined' ? localStorage.getItem('i18nextLng') || '' : '';

  const filteredBooks = useMemo(() => {
    const bookFilter = createBookFilter(queryTerm);
    return libraryBooks.filter((book) => !book.deletedAt && bookFilter(book));
  }, [libraryBooks, queryTerm]);

  const categories = useMemo(() => {
    const bookSorter = createBookSorter(sortBy, uiLanguage);
    const sortOrderMultiplier = sortOrder === 'asc' ? 1 : -1;
    
    const sorted = [...filteredBooks].sort((a, b) => bookSorter(a, b) * sortOrderMultiplier);
    
    const groups: Record<string, Book[]> = {};
    sorted.forEach((book) => {
      const cat = book.groupName || _('Other');
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(book);
    });

    return Object.entries(groups).map(([name, books]) => ({
      name,
      books,
    }));
  }, [filteredBooks, sortBy, sortOrder, uiLanguage, _]);

  useEffect(() => {
    onScrollerRef(autofocusRef.current);
  }, [onScrollerRef, autofocusRef]);

  const selectedBooks = getSelectedBooks();

  const handleUpdateReadingStatus = useCallback(
    async (book: Book, status: ReadingStatus | undefined) => {
      const updatedBook = { ...book, readingStatus: status, updatedAt: Date.now() };
      await updateBooks(envConfig, [updatedBook]);
    },
    [envConfig, updateBooks],
  );

  const openSelectedBooks = () => {
    handleSetSelectMode(false);
    navigateToReader(router, getSelectedBooks());
  };

  const openBookDetails = () => {
    handleSetSelectMode(false);
    const book = libraryBooks.find((book) => book.hash === getSelectedBooks()[0]);
    if (book) handleShowDetailsBook(book);
  };

  const confirmDelete = async () => {
    const booksToDelete = filteredBooks.filter(b => selectedBooks.includes(b.hash));
    for (const book of booksToDelete) {
      if (abortDeletionRef.current) break;
      await handleBookDelete(book, false);
    }
    handlePushLibrary();
    setSelectedBooks([]);
    setShowDeleteAlert(false);
  };

  const updateBooksStatus = async (status: ReadingStatus | undefined) => {
    const booksToUpdate = filteredBooks
      .filter(b => selectedBooks.includes(b.hash))
      .map(b => ({ ...b, readingStatus: status, updatedAt: Date.now() }));
    
    if (booksToUpdate.length > 0) await updateBooks(envConfig, booksToUpdate);
    setSelectedBooks([]);
    setShowStatusAlert(false);
  };

  useEffect(() => {
    if (isSelectMode) {
      setShowSelectModeActions(true);
      if (isSelectAll) {
        const hashes = filteredBooks.map(b => b.hash);
        const currentSelected = getSelectedBooks();
        if (hashes.length !== currentSelected.length || !hashes.every(h => currentSelected.includes(h))) {
          setSelectedBooks(hashes);
        }
      } else if (isSelectNone) {
        if (getSelectedBooks().length > 0) {
          setSelectedBooks([]);
        }
      }
    } else {
      if (getSelectedBooks().length > 0) {
        setSelectedBooks([]);
      }
      setShowSelectModeActions(false);
    }
  }, [isSelectMode, isSelectAll, isSelectNone, filteredBooks, setSelectedBooks, getSelectedBooks]);

  return (
    <div
      ref={autofocusRef}
      tabIndex={-1}
      role='main'
      aria-label={_('Bookshelf')}
      className='bookshelf min-h-0 flex-grow focus:outline-none overflow-y-auto px-4 sm:px-6'
    >
      <div className='max-w-7xl mx-auto py-8'>
        {categories.map((category) => (
          <details
            key={category.name}
            className="collapse collapse-arrow bg-base-100/40 backdrop-blur-md mb-8 shadow-lg rounded-3xl border border-premium-gold/10 group overflow-visible transition-all duration-500 hover:shadow-xl hover:border-premium-gold/20"
            open={categories.length <= 3 || category.books.some(b => b.readingStatus === 'reading')}
          >
            <summary className="collapse-title text-xl font-semibold px-8 py-6 cursor-pointer hover:bg-base-200/50 transition-colors">
              <div className="flex items-center gap-4">
                <span className="text-base-content shelf-title text-3xl font-display tracking-tight">{category.name}</span>
                <span className="badge badge-primary badge-outline badge-sm opacity-60 font-sans px-3 py-2">{category.books.length}</span>
              </div>
            </summary>
            <div className="collapse-content px-6 pb-8">
              <div className={clsx(BOOKSHELF_GRID_CLASSES, 'pt-6 gap-y-10')}>                {category.books.map((book) => (
                  <BookshelfItem
                    key={book.hash}
                    item={book}
                    mode={viewMode as LibraryViewModeType}
                    coverFit={coverFit as LibraryCoverFitType}
                    isSelectMode={isSelectMode}
                    itemSelected={selectedBooks.includes(book.hash)}
                    setLoading={setLoading}
                    toggleSelection={toggleSelectedBook}
                    handleGroupBooks={() => setShowGroupingModal(true)}
                    handleBookUpload={handleBookUpload}
                    handleBookDownload={handleBookDownload}
                    handleBookDelete={handleBookDelete}
                    handleSetSelectMode={handleSetSelectMode}
                    handleShowDetailsBook={handleShowDetailsBook}
                    handleLibraryNavigation={handleLibraryNavigation}
                    handleUpdateReadingStatus={handleUpdateReadingStatus}
                    transferProgress={booksTransferProgress[book.hash] || null}
                  />
                ))}
              </div>
            </div>
          </details>
        ))}

        <div className="flex justify-center mt-12 mb-20">
          <button
            className="btn btn-ghost btn-lg gap-2 text-primary/70 hover:text-primary transition-all border-dashed border-2 border-primary/30 hover:border-primary/60 rounded-2xl px-16 py-8 shelf-title text-xl"
            onClick={handleImportBooks}
          >
            <PiPlus className="text-2xl" />
            {_('Import Books')}
          </button>
        </div>
      </div>

      {loading && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-base-200/50 backdrop-blur-sm'>
          <Spinner loading />
        </div>
      )}

      {isSelectMode && showSelectModeActions && (
        <SelectModeActions
          selectedBooks={selectedBooks}
          safeAreaBottom={safeAreaInsets?.bottom || 0}
          onOpen={openSelectedBooks}
          onGroup={() => setShowGroupingModal(true)}
          onDetails={openBookDetails}
          onStatus={() => setShowStatusAlert(true)}
          onDelete={() => setShowDeleteAlert(true)}
          onCancel={() => handleSetSelectMode(false)}
        />
      )}

      {showDeleteAlert && (
        <div className='delete-alert fixed bottom-8 left-0 right-0 z-50 flex justify-center px-4'>
          <Alert
            title={_('Confirm Deletion')}
            message={_('Are you sure to delete {{count}} selected book(s)?', {
              count: selectedBooks.length,
            })}
            onCancel={() => setShowDeleteAlert(false)}
            onConfirm={confirmDelete}
          />
        </div>
      )}

      {showStatusAlert && (
        <SetStatusAlert
          selectedCount={selectedBooks.length}
          safeAreaBottom={safeAreaInsets?.bottom || 0}
          onCancel={() => setShowStatusAlert(false)}
          onUpdateStatus={updateBooksStatus}
        />
      )}

      {showGroupingModal && (
        <GroupingModal
          libraryBooks={libraryBooks}
          selectedBooks={selectedBooks}
          parentGroupName={''}
          onCancel={() => setShowGroupingModal(false)}
          onConfirm={() => {
            setShowGroupingModal(false);
            handlePushLibrary();
          }}
        />
      )}
    </div>
  );
};

export default Bookshelf;
