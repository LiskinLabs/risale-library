import React, { useState } from 'react';

interface Props {
  arabic: string;
  translation: string;
}

const QuranText: React.FC<Props> = ({ arabic, translation }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <span
      className='group relative inline-block cursor-help'
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className='font-arabic rounded px-1 text-2xl leading-loose text-amber-700 transition-colors hover:bg-amber-100 dark:text-amber-500 dark:hover:bg-amber-900/30'>
        {arabic}
      </span>

      {showTooltip && translation && (
        <span className='animate-in fade-in zoom-in pointer-events-none absolute bottom-full left-1/2 z-[100] mb-2 w-64 -translate-x-1/2 rounded-xl bg-slate-800 p-3 text-xs text-white shadow-2xl duration-200 dark:bg-slate-700'>
          <span className='mb-1 block font-bold text-amber-400'>Перевод:</span>
          {translation}
          <span className='absolute left-1/2 top-full -translate-x-1/2 border-8 border-transparent border-t-slate-800 dark:border-t-slate-700'></span>
        </span>
      )}
    </span>
  );
};

export default QuranText;
