'use client';

import React, { useCallback } from 'react';

import Dialog from '@/components/Dialog';
import { useEnv } from '@/context/EnvContext';
import { useReaderStore } from '@/store/readerStore';
import { saveViewSettings } from '@/helpers/settings';
import {
  useDictionaryResults,
  DictionaryResultsHeader,
  DictionaryResultsBody,
} from './DictionaryResultsView';

interface DictionarySheetProps {
  word: string;
  lang?: string;
  bookKey: string;
  context?: { before?: string; after?: string };
  onDismiss: () => void;
  onManage?: () => void;
}

const DictionarySheet: React.FC<DictionarySheetProps> = ({
  word,
  lang,
  bookKey,
  context,
  onDismiss,
  onManage,
}) => {
  const { envConfig } = useEnv();
  const { getViewSettings, setViewSettings } = useReaderStore();
  const state = useDictionaryResults({ word, lang, bookKey, context });

  const handleLanguageChange = useCallback(
    (newLang: string) => {
      const viewSettings = getViewSettings(bookKey);
      if (!viewSettings) return;
      viewSettings.dictionaryLanguage = newLang;
      setViewSettings(bookKey, viewSettings);
      saveViewSettings(envConfig, bookKey, 'dictionaryLanguage', newLang, true, false);
    },
    [bookKey, envConfig, getViewSettings, setViewSettings],
  );

  const viewSettings = getViewSettings(bookKey);
  const currentLang = viewSettings?.dictionaryLanguage || 'ru';

  return (
    <Dialog
      isOpen
      snapHeight={0.75}
      dismissible
      header={
        <DictionaryResultsHeader
          headerClassName='-mt-4'
          currentWord={state.currentWord}
          canGoBack={state.canGoBack}
          goBack={state.goBack}
          onManage={onManage}
          dictionaryLanguage={currentLang}
          onLanguageChange={handleLanguageChange}
        />
      }
      contentClassName='!px-0 !mt-0'
      onClose={onDismiss}
    >
      <DictionaryResultsBody {...state} />
    </Dialog>
  );
};

export default DictionarySheet;
