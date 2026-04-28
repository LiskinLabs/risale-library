import React from 'react';
import { useStore } from '@nanostores/react';
import { fontScale } from '../../stores/readerStore';

export const SettingsBar = () => {
  const scale = useStore(fontScale);

  return (
    <div className='flex items-center gap-3 rounded-full border border-slate-200 bg-white/90 p-1 px-4 py-2 shadow-lg backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90'>
      <div className='mr-1 flex items-center border-r border-slate-200 pr-3 dark:border-slate-800'>
        <button
          onClick={() => fontScale.set(Math.max(0.7, scale - 0.1))}
          className='flex h-8 w-8 items-center justify-center rounded-full font-bold text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          title='Уменьшить шрифт'
        >
          A-
        </button>
        <span className='w-10 text-center font-mono text-[10px] text-slate-400'>
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => fontScale.set(Math.min(2.5, scale + 0.1))}
          className='flex h-8 w-8 items-center justify-center rounded-full font-bold text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
          title='Увеличить шрифт'
        >
          A+
        </button>
      </div>
      <div className='hidden text-[10px] font-bold uppercase tracking-tighter text-slate-400 sm:block'>
        Настройки чтения
      </div>
    </div>
  );
};
