import React, { useState } from 'react';

interface Props {
  arabic: string;
  translation: string;
}

const QuranText: React.FC<Props> = ({ arabic, translation }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <span 
      className="relative inline-block group cursor-help"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className="font-arabic text-2xl text-amber-700 dark:text-amber-500 leading-loose hover:bg-amber-100 dark:hover:bg-amber-900/30 px-1 rounded transition-colors">
        {arabic}
      </span>
      
      {showTooltip && translation && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 dark:bg-slate-700 text-white text-xs rounded-xl shadow-2xl z-[100] animate-in fade-in zoom-in duration-200 pointer-events-none">
          <span className="block font-bold text-amber-400 mb-1">Перевод:</span>
          {translation}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800 dark:border-t-slate-700"></span>
        </span>
      )}
    </span>
  );
};

export default QuranText;
