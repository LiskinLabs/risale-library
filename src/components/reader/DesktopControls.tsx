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
    <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-4 ml-4">
      <button 
        onClick={handleMinimize}
        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
        title="Свернуть"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
        </svg>
      </button>
      <button 
        onClick={handleClose}
        className="p-2 hover:bg-red-500 hover:text-white rounded-lg text-slate-500 transition-colors"
        title="Закрыть"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};
