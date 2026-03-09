import React, { useState } from 'react';

interface Props {
  word: string;
  meaning: string;
}

export const Lugat = ({ word, meaning }: Props) => {
  const [show, setShow] = useState(false);

  return (
    <span 
      className="relative cursor-help border-b border-dotted border-amber-600 text-amber-900 dark:text-amber-400 group mx-1"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onClick={() => setShow(!show)}
    >
      {word}
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-white dark:bg-slate-800 text-sm shadow-xl rounded-lg border border-amber-100 z-50 animate-in fade-in zoom-in duration-200 text-center leading-relaxed">
          <span className="block font-bold text-amber-700 mb-1 border-b border-amber-50 pb-1">{word}</span>
          <span className="text-slate-600 dark:text-slate-300">{meaning}</span>
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white dark:border-t-slate-800"></span>
        </span>
      )}
    </span>
  );
};
