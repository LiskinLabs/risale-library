import React from 'react';
import { useStore } from '@nanostores/react';
import { fontScale } from '../../stores/readerStore';

export const SettingsBar = () => {
  const scale = useStore(fontScale);

  return (
    <div className="flex items-center gap-3 p-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full shadow-lg border border-slate-200 dark:border-slate-800 px-4 py-2">
      <div className="flex items-center border-r border-slate-200 dark:border-slate-800 pr-3 mr-1">
        <button 
          onClick={() => fontScale.set(Math.max(0.7, scale - 0.1))}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400 font-bold"
          title="Уменьшить шрифт"
        >A-</button>
        <span className="text-[10px] font-mono w-10 text-center text-slate-400">{Math.round(scale * 100)}%</span>
        <button 
          onClick={() => fontScale.set(Math.min(2.5, scale + 0.1))}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-200 font-bold"
          title="Увеличить шрифт"
        >A+</button>
      </div>
      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter hidden sm:block">
        Настройки чтения
      </div>
    </div>
  );
};
