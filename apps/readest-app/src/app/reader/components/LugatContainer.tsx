import React, { useState } from 'react';
import { useReaderStore } from '@/store/readerStore';
import { useLugatHighlight } from '../hooks/useLugatHighlight';
import LugatPopup from './LugatPopup';

export const LugatContainer: React.FC<{ bookKey: string }> = ({ bookKey }) => {
  const [word, setWord] = useState<string | null>(null);
  const [lang, setLang] = useState<string>('tr');
  const { getView } = useReaderStore();

  const view = getView(bookKey);

  useLugatHighlight(
    bookKey,
    view,
    true, // always enabled for now, or fetch from settings
    (w, l) => {
      setWord(w);
      setLang(l);
    },
  );

  return <>{word && <LugatPopup word={word} lang={lang} onClose={() => setWord(null)} />}</>;
};

export default LugatContainer;
