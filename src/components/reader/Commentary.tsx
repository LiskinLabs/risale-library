import React from 'react';
import { useStore } from '@nanostores/react';
import { isCommentaryVisible } from '../../stores/readerStore';

export const Commentary = ({ children }: { children: React.ReactNode }) => {
  const visible = useStore(isCommentaryVisible);

  return (
    <div
      className={`overflow-hidden transition-all duration-700 ease-in-out ${visible ? 'my-6 max-h-[5000px] translate-y-0 scale-100 opacity-100' : 'max-h-0 -translate-y-2 scale-95 opacity-0'} `}
    >
      <div className='rounded-r-lg border-y border-l-4 border-emerald-100/20 border-emerald-500 bg-emerald-50/50 px-4 py-4 pl-6 italic text-slate-700 shadow-sm dark:bg-emerald-900/10 dark:text-slate-300'>
        <span className='mb-2 block text-xs font-bold uppercase not-italic tracking-wider text-emerald-600'>
          Комментарий
        </span>
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
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition-all duration-300 ${
        visible
          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
          : 'bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
      } `}
    >
      <span
        className={`h-2 w-2 rounded-full ${visible ? 'animate-pulse bg-white' : 'bg-slate-400'}`}
      ></span>
      {visible ? 'Комментарии: Вкл' : 'Комментарии: Выкл'}
    </button>
  );
};
