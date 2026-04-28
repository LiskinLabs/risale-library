import React, { useEffect, useState } from 'react';

export const DesktopControls = () => {
  const [isTauri, setIsTauri] = useState(false);

  useEffect(() => {
    // Check if running inside Tauri
    // @ts-ignore
    if (window.__TAURI_INTERNALS__ || window.__TAURI__) {
      setIsTauri(true);
    }
  }, []);

  if (!isTauri) return null;

  const handleMinimize = async () => {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().minimize();
  };

  const handleClose = async () => {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().close();
  };

  return (
    <div className='ml-4 flex items-center gap-1 border-l border-slate-200 pl-4 dark:border-slate-800'>
      <button
        onClick={handleMinimize}
        className='rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800'
        title='Свернуть'
      >
        <svg
          xmlns='http://www.w3.org/2000/svg'
          className='h-4 w-4'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M20 12H4' />
        </svg>
      </button>
      <button
        onClick={handleClose}
        className='rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-500 hover:text-white'
        title='Закрыть'
      >
        <svg
          xmlns='http://www.w3.org/2000/svg'
          className='h-4 w-4'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path
            stroke-linecap='round'
            stroke-linejoin='round'
            stroke-width='2'
            d='M6 18L18 6M6 6l12 12'
          />
        </svg>
      </button>
    </div>
  );
};
