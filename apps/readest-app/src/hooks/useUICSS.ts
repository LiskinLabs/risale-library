import { useEffect, useRef } from 'react';
import { useReaderStore } from '@/store/readerStore';
import { useSettingsStore } from '@/store/settingsStore';

// This hook allows you to inject custom CSS into the reader UI.
// Note that the book content is rendered in an iframe, so UI CSS won't affect book rendering.
export const useUICSS = (bookKey?: string) => {
  const { settings } = useSettingsStore();
  const { getViewSettings } = useReaderStore();
  const viewSettings = getViewSettings(bookKey || '');
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    const rawCSS =
      viewSettings?.userUIStylesheet || settings?.globalViewSettings?.userUIStylesheet || '';

    if (!styleRef.current) {
      styleRef.current = document.createElement('style');
      document.head.appendChild(styleRef.current);
    }
    
    styleRef.current.textContent = rawCSS.replace('foliate-view', `#foliate-view-${bookKey}`);

    return () => {
      if (styleRef.current) {
        styleRef.current.remove();
        styleRef.current = null;
      }
    };
  }, [viewSettings?.userUIStylesheet, settings?.globalViewSettings?.userUIStylesheet, bookKey]);
};
