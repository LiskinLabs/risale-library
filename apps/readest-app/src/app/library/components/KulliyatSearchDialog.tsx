'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useKulliyatSearchStore } from '@/store/kulliyatSearchStore';
import { useEnv } from '@/context/EnvContext';
import { useSettingsStore } from '@/store/settingsStore';
import { ReedyDb } from '@/services/reedy/db/ReedyDb';
import { BookRetriever } from '@/services/reedy/retrieval/BookRetriever';
import { createReedyModels } from '@/services/reedy/models/registry';
import { useTranslation } from '@/hooks/useTranslation';
import ModalPortal from '@/components/ModalPortal';
import { FaSearch } from 'react-icons/fa';
import { IoMdClose } from 'react-icons/io';
import { useLibraryStore } from '@/store/libraryStore';
import { navigateToReader } from '@/utils/nav';
import { useAppRouter } from '@/hooks/useAppRouter';
import { debounce } from '@/utils/debounce';
import Spinner from '@/components/Spinner';

export const KulliyatSearchDialog: React.FC = () => {
  const {
    isOpen,
    query,
    results,
    isSearching,
    error,
    close,
    setQuery,
    setResults,
    setIsSearching,
    setError,
  } = useKulliyatSearchStore();
  const { appService } = useEnv();
  const { settings } = useSettingsStore();
  const { library } = useLibraryStore();
  const _ = useTranslation();
  const router = useAppRouter();

  const [db, setDb] = useState<ReedyDb | null>(null);
  const models = useMemo(() => createReedyModels(settings.aiSettings), [settings.aiSettings]);

  useEffect(() => {
    if (!isOpen || !appService) return;

    let alive = true;
    appService
      .openDatabase('reedy', 'reedy.db', 'Data', { experimental: ['index_method'] })
      .then((svc) => {
        if (alive) setDb(new ReedyDb(svc));
      })
      .catch((err) => {
        if (alive) setError(String(err));
      });

    return () => {
      alive = false;
    };
  }, [isOpen, appService, setError]);

  const handleSearch = useCallback(
    async (q: string) => {
      if (!q.trim() || !db) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      setError(null);
      try {
        const retriever = new BookRetriever(db);
        const res = await retriever.globalSearch({
          query: q,
          k: 40,
          activeEmbeddingModel: models.embedding,
        });
        setResults(res.passages);
      } catch (err) {
        setError(String(err));
      } finally {
        setIsSearching(false);
      }
    },
    [db, models.embedding, setIsSearching, setError, setResults],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((q: string) => handleSearch(q), 500),
    [handleSearch],
  );

  useEffect(() => {
    if (query.length > 2) {
      debouncedSearch(query);
    } else {
      setResults([]);
    }
  }, [query, debouncedSearch, setResults]);

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className='fixed inset-0 z-[60] flex flex-col bg-base-100 shadow-2xl'>
        <header className='border-base-content/10 flex h-16 items-center border-b px-4'>
          <FaSearch className='text-base-content/50 mr-3' />
          <input
            autoFocus
            type='text'
            className='flex-1 bg-transparent text-xl focus:outline-none'
            placeholder={_('Külliyat Araması...')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch(query);
              if (e.key === 'Escape') close();
            }}
          />
          {isSearching && <Spinner loading className='mr-4 h-6 w-6' />}
          <button className='btn btn-ghost btn-circle' onClick={close} aria-label={_('Close')}>
            <IoMdClose size={24} />
          </button>
        </header>

        <main className='flex-1 overflow-y-auto p-4'>
          {error && <div className='alert alert-error mb-4'>{error}</div>}

          <div className='mx-auto flex max-w-4xl flex-col gap-4 pb-20'>
            {results.map((res) => {
              const book = library.find((b) => b.hash === res.bookHash);
              return (
                <div
                  key={res.id}
                  className='bg-base-200 hover:bg-base-300 cursor-pointer rounded-lg p-4 transition-colors'
                  onClick={() => {
                    if (book) {
                      navigateToReader(router, [book.hash], `cfi=${encodeURIComponent(res.cfi)}`);
                      close();
                    }
                  }}
                >
                  <div className='mb-2 flex items-start justify-between'>
                    <span className='text-primary text-xs font-bold uppercase tracking-wider'>
                      {book?.title || 'Unknown Book'}
                    </span>
                    <span className='text-xs opacity-50'>{res.chapterTitle}</span>
                  </div>
                  <p className='text-sm leading-relaxed line-clamp-3'>{res.text}</p>
                </div>
              );
            })}

            {!isSearching && results.length === 0 && query.length > 2 && (
              <div className='p-12 text-center opacity-50'>{_('Sonuç bulunamadı')}</div>
            )}

            {!isSearching && query.length <= 2 && query.length > 0 && (
              <div className='p-12 text-center opacity-50'>
                {_('Aramak için en az 3 harf girin')}
              </div>
            )}
          </div>
        </main>
      </div>
    </ModalPortal>
  );
};
