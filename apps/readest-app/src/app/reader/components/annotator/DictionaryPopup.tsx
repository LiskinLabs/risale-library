'use client';

import React, { useCallback } from 'react';

import Popup from '@/components/Popup';
import { Position } from '@/utils/sel';
import { useEnv } from '@/context/EnvContext';
import { useReaderStore } from '@/store/readerStore';
import { saveViewSettings } from '@/helpers/settings';
import {
  useDictionaryResults,
  DictionaryResultsHeader,
  DictionaryResultsBody,
} from './DictionaryResultsView';

interface DictionaryPopupProps {
  word: string;
  lang?: string;
  bookKey: string;
  context?: { before?: string; after?: string };
  position: Position;
  trianglePosition: Position;
  popupWidth: number;
  popupHeight: number;
  onDismiss?: () => void;
  onManage?: () => void;
}

const DictionaryPopup: React.FC<DictionaryPopupProps> = ({
  word,
  lang,
  bookKey,
  context,
  position,
  trianglePosition,
  popupWidth,
  popupHeight,
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

  // Read current language from viewSettings for the dropdown
  const viewSettings = getViewSettings(bookKey);
  const currentLang = viewSettings?.dictionaryLanguage || 'ru';

  return (
    <Popup
      width={popupWidth}
      height={popupHeight}
      position={position}
      trianglePosition={trianglePosition}
      className='select-text'
      onDismiss={onDismiss}
    >
      <div className='flex h-full flex-col overflow-hidden rounded-lg pt-4'>
        <DictionaryResultsHeader
          headerClassName='-mt-2'
          currentWord={state.currentWord}
          canGoBack={state.canGoBack}
          goBack={state.goBack}
          onManage={onManage}
          dictionaryLanguage={currentLang}
          onLanguageChange={handleLanguageChange}
        />
        <div className='min-h-0 flex-1'>
          <DictionaryResultsBody {...state} />
        </div>
      </div>
    </Popup>
  );
};

export default DictionaryPopup;
