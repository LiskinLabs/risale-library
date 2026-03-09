import React from 'react';
import { useStore } from '@nanostores/react';
import { isCommentaryVisible } from '../../stores/readerStore';

export const Commentary = ({ children }: { children: React.ReactNode }) => {
  const visible = useStore(isCommentaryVisible);

  return (
    <div className={`
      transition-all duration-700 ease-in-out overflow-hidden
      ${visible ? 'opacity-100 max-h-[5000px] my-6 translate-y-0 scale-100' : 'opacity-0 max-h-0 -translate-y-2 scale-95'}
    `}>
      <div className="pl-6 border-l-4 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10 py-4 px-4 italic text-slate-700 dark:text-slate-300 rounded-r-lg shadow-sm border-y border-emerald-100/20">
        <span className="block text-xs uppercase font-bold text-emerald-600 mb-2 not-italic tracking-wider">Комментарий</span>
        {children}
      </div>
    </div>
  );
};

export const CommentaryToggle = () => {
  const visible = useStore(isCommentaryVisible);
  return (
    <button 
      onClick={() => isCommentaryVisible.set(!visible)}
      className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 shadow-sm
        ${visible 
          ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
          : 'bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'}
      `}
    >
      <span className={`w-2 h-2 rounded-full ${visible ? 'bg-white animate-pulse' : 'bg-slate-400'}`}></span>
      {visible ? 'Комментарии: Вкл' : 'Комментарии: Выкл'}
    </button>
  );
};
