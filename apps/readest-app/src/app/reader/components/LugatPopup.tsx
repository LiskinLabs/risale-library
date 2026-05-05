import React, { useEffect, useState } from 'react';
import { lugatService } from '@/services/lugatService';

interface LugatPopupProps {
  word: string;
  lang: string;
  onClose: () => void;
}

const LugatPopup: React.FC<LugatPopupProps> = ({ word, lang, onClose }) => {
  const [definition, setDefinition] = useState<string | null>(null);

  useEffect(() => {
    const fetchDefinition = async () => {
      await lugatService.loadMetadata();
      const res = lugatService.lookup(word, lang);
      setDefinition(res);
    };
    fetchDefinition();
  }, [word, lang]);

  if (!definition) return null;

  return (
    <div className='bg-base-100 border-primary/20 animate-in fade-in slide-in-from-bottom-4 fixed bottom-10 left-1/2 z-[100] w-[90vw] max-w-sm -translate-x-1/2 rounded-2xl border-2 p-5 shadow-2xl duration-300'>
      <div className='mb-2 flex items-start justify-between'>
        <h4 className='text-primary text-xs font-black uppercase tracking-widest'>
          Lugat — Sözlük
        </h4>
        <button onClick={onClose} className='btn btn-ghost btn-xs btn-circle'>
          ✕
        </button>
      </div>
      <div className='space-y-2'>
        <div className='text-base-content border-base-300 border-b pb-1 text-xl font-bold'>
          {word}
        </div>
        <p className='text-base-content/80 italic leading-relaxed'>{definition}</p>
      </div>
    </div>
  );
};

export default LugatPopup;
