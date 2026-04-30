'use client';

import clsx from 'clsx';
import { useState, useRef, useEffect, Suspense, useCallback } from 'react';
import { ReadonlyURLSearchParams, useSearchParams } from 'next/navigation';

import { Book } from '@/types/book';
import { transferManager } from '@/services/transferManager';
import { isTauriAppPlatform } from '@/services/environment';
import { checkForAppUpdates, checkAppReleaseNotes } from '@/helpers/updater';
import { getCurrentWebview } from '@tauri-apps/api/webview';

import { useEnv } from '@/context/EnvContext';
import { useThemeStore } from '@/store/themeStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useLibraryStore } from '@/store/libraryStore';
import { useSettingsStore } from '@/store/settingsStore';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useTheme } from '@/hooks/useTheme';
import { useUICSS } from '@/hooks/useUICSS';
import { useBooksSync } from './hooks/useBooksSync';
import { useScreenWakeLock } from '@/hooks/useScreenWakeLock';
import { useOpenWithBooks } from '@/hooks/useOpenWithBooks';
import { useKeyDownActions } from '@/hooks/useKeyDownActions';
import { SelectedFile, useFileSelector } from '@/hooks/useFileSelector';
import { lockScreenOrientation } from '@/utils/bridge';
import {
  tauriHandleClose,
  tauriHandleSetAlwaysOnTop,
  tauriHandleToggleFullScreen,
  tauriQuitApp,
} from '@/utils/window';

import { BookMetadata } from '@/libs/document';
import { BookDetailModal } from '@/components/metadata';
import { CatalogDialog } from './components/OPDSDialog';
import { useTransferQueue } from '@/hooks/useTransferQueue';
import { Toast } from '@/components/Toast';
import Spinner from '@/components/Spinner';
import LibraryHeader from './components/LibraryHeader';
import RisaleCatalog from './components/RisaleCatalog';
import useShortcuts from '@/hooks/useShortcuts';
import DropIndicator from '@/components/DropIndicator';

const LibraryPageWithSearchParams = () => {
  const searchParams = useSearchParams();
  return <LibraryPageContent searchParams={searchParams} />;
};

const LibraryPageContent = ({ searchParams }: { searchParams: ReadonlyURLSearchParams | null }) => {
  const { envConfig, appService } = useEnv();
  const {
    library: libraryBooks,
    isSyncing,
    updateBook,
    updateBooks,
    setLibrary,
    getGroupName,
  } = useLibraryStore();
  const _ = useTranslation();
  const { selectFiles } = useFileSelector(appService, _);
  const { safeAreaInsets: insets, isRoundedWindow } = useThemeStore();
  const { settings, setSettings } = useSettingsStore();
  const { setSettingsDialogOpen } = useSettingsStore();
  const [showCatalogManager, setShowCatalogManager] = useState(
    searchParams?.get('opds') === 'true',
  );
  const [loading, setLoading] = useState(false);
  const [libraryLoaded, setLibraryLoaded] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [showDetailsBook, setShowDetailsBook] = useState<Book | null>(null);
  const isInitiating = useRef(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const handleScrollerRef = useCallback((el: HTMLDivElement | null) => {
    scrollRef.current = el;
  }, []);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  useTheme({ systemUIVisible: true, appThemeColor: 'base-200' });
  useUICSS();

  useOpenWithBooks();
  useTransferQueue(libraryLoaded);

  const { pullLibrary, pushLibrary } = useBooksSync();

  usePullToRefresh(
    scrollRef,
    async () => {
      await pullLibrary(false, true);
    },
    async () => {
      await pullLibrary(true, true);
    },
  );
  useScreenWakeLock(settings.screenWakeLock);

  useShortcuts({
    onToggleFullscreen: async () => {
      if (isTauriAppPlatform()) {
        await tauriHandleToggleFullScreen();
      }
    },
    onCloseWindow: async () => {
      if (isTauriAppPlatform()) {
        await tauriHandleClose();
      }
    },
    onQuitApp: async () => {
      if (isTauriAppPlatform()) {
        await tauriQuitApp();
      }
    },
    onOpenFontLayoutSettings: () => {
      setSettingsDialogOpen(true);
    },
    onOpenBooks: () => {
      handleImportBooksFromFiles();
    },
  });

  useEffect(() => {
    sessionStorage.setItem('lastLibraryParams', searchParams?.toString() || '');
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (searchParams?.get('group') !== '') return;
    const url = new URL(window.location.href);
    url.searchParams.delete('group');
    const cleanHref = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(null, '', cleanHref);
  }, [searchParams]);

  const triggerBackUpOneGroupLevel = useCallback(() => {
    // Basic implementation since breadcrumbs are removed for now
    window.history.back();
  }, []);

  useKeyDownActions({
    onCancel: triggerBackUpOneGroupLevel,
    enabled: !!appService?.isAndroidApp,
  });

  useEffect(() => {
    const doCheckAppUpdates = async () => {
      if (appService?.hasUpdater && settings.autoCheckUpdates) {
        await checkForAppUpdates(_);
      } else if (appService?.hasUpdater === false) {
        checkAppReleaseNotes();
      }
    };
    if (settings.alwaysOnTop) {
      tauriHandleSetAlwaysOnTop(settings.alwaysOnTop);
    }
    doCheckAppUpdates();
  }, [appService?.hasUpdater, settings, _]);

  useEffect(() => {
    if (appService?.isMobileApp) {
      lockScreenOrientation({ orientation: 'auto' });
    }
  }, [appService]);

  useEffect(() => {
    if (appService?.hasWindow) {
      const currentWebview = getCurrentWebview();
      const unlisten = currentWebview.listen('close-reader-window', async () => {
        const appService = await envConfig.getAppService();
        const settings = await appService.loadSettings();
        const library = await appService.loadLibraryBooks();
        setSettings(settings);
        setLibrary(library);
      });
      return () => {
        unlisten.then((fn) => fn());
      };
    }
    return;
  }, [appService, envConfig, setSettings, setLibrary]);

  useEffect(() => {
    if (!libraryBooks.some((book) => !book.deletedAt)) {
      handleSetSelectMode(false);
    }
  }, [libraryBooks]);

  useEffect(() => {
    if (isInitiating.current) return;
    isInitiating.current = true;

    const initLibrary = async () => {
      const appService = await envConfig.getAppService();
      const settings = await appService.loadSettings();
      setSettings(settings);
      const library = libraryBooks.length > 0 ? libraryBooks : await appService.loadLibraryBooks();
      setLibrary(library);
      setLibraryLoaded(true);
      setLoading(false);
    };

    initLibrary();
    return () => {
      isInitiating.current = false;
    };
  }, [envConfig, setSettings, setLibrary, libraryBooks]);

  const importBooks = async (files: SelectedFile[], groupId?: string) => {
    if (!appService) return;
    setLoading(true);
    const { library } = useLibraryStore.getState();
    const processFile = async (selectedFile: SelectedFile): Promise<Book | null> => {
      const file = selectedFile.file || selectedFile.path;
      if (!file) return null;
      try {
        const book = await appService.importBook(file, library);
        if (!book) return null;
        if (groupId) {
          book.groupId = groupId;
          book.groupName = getGroupName(groupId);
        }
        return book;
      } catch (_error) {
        return null;
      }
    };

    const importedBooks = (await Promise.all(files.map(processFile))).filter(
      (book) => !!book,
    ) as Book[];
    await updateBooks(envConfig, importedBooks);
    pushLibrary();
    setLoading(false);
  };

  const handleBookUpload = useCallback(async (book: Book) => {
    const transferId = transferManager.queueUpload(book, 1);
    return !!transferId;
  }, []);

  const handleBookDownload = useCallback(async (book: Book) => {
    const transferId = transferManager.queueDownload(book, 1);
    return !!transferId;
  }, []);

  const handleBookDelete = (deleteAction: 'local' | 'both' | 'cloud') => {
    return async (book: Book, syncBooks = true) => {
      try {
        if (deleteAction === 'local' || deleteAction === 'both') {
          await appService?.deleteBook(book, 'local');
          if (deleteAction === 'both') {
            book.deletedAt = Date.now();
          }
          await updateBook(envConfig, book);
          if (syncBooks) pushLibrary();
        }
        return true;
      } catch {
        return false;
      }
    };
  };

  const handleUpdateMetadata = async (book: Book, metadata: BookMetadata) => {
    book.metadata = metadata;
    await updateBook(envConfig, book);
  };

  const handleImportBooksFromFiles = async () => {
    setIsSelectMode(false);
    selectFiles({ type: 'books', multiple: true }).then((result) => {
      if (result.files.length === 0 || result.error) return;
      importBooks(result.files, searchParams?.get('group') || '');
    });
  };

  const handleSetSelectMode = (selectMode: boolean) => {
    setIsSelectMode(selectMode);
  };

  const handleSelectAll = () => {
    setIsSelectAll(true);
  };
  const handleDeselectAll = () => {
    setIsSelectAll(false);
  };
  const handleShowOPDSDialog = () => {
    setShowCatalogManager(true);
  };

  if (!appService || !insets) return <div className='full-height bg-base-200' />;

  return (
    <div
      ref={pageRef}
      className={clsx(
        'library-page text-base-content full-height bg-base-200 flex select-none flex-col overflow-hidden',
        isRoundedWindow && 'window-border rounded-window',
      )}
    >
      <div className='relative top-0 z-40 w-full'>
        <LibraryHeader
          isSelectMode={isSelectMode}
          isSelectAll={isSelectAll}
          onPullLibrary={pullLibrary}
          onImportBooksFromFiles={handleImportBooksFromFiles}
          onOpenCatalogManager={handleShowOPDSDialog}
          onToggleSelectMode={() => handleSetSelectMode(!isSelectMode)}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
        />
      </div>
      {(loading || isSyncing) && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm'>
          <Spinner loading />
        </div>
      )}

      <div className='flex min-h-0 flex-grow flex-col'>
        <div
          ref={containerRef}
          className='scroll-container drop-zone flex min-h-0 flex-grow flex-col'
          onScroll={(e) => handleScrollerRef(e.currentTarget)}
        >
          <DropIndicator />
          <RisaleCatalog
            userBooks={libraryBooks.filter((book) => !book.deletedAt)}
            onImportClick={handleImportBooksFromFiles}
          />
        </div>
      </div>

      {showDetailsBook && (
        <BookDetailModal
          isOpen={!!showDetailsBook}
          book={showDetailsBook}
          onClose={() => setShowDetailsBook(null)}
          handleBookUpload={handleBookUpload}
          handleBookDownload={handleBookDownload}
          handleBookDelete={handleBookDelete('both')}
          handleBookDeleteCloudBackup={handleBookDelete('cloud')}
          handleBookDeleteLocalCopy={handleBookDelete('local')}
          handleBookMetadataUpdate={handleUpdateMetadata}
        />
      )}
      {showCatalogManager && <CatalogDialog onClose={() => setShowCatalogManager(false)} />}
      <Toast />
    </div>
  );
};

const LibraryPage = () => {
  return (
    <Suspense fallback={<div className='full-height' />}>
      <LibraryPageWithSearchParams />
    </Suspense>
  );
};

export default LibraryPage;
