'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getPopupPosition, getPosition, Position } from '@/utils/sel';
import { eventDispatcher } from '@/utils/event';
import { Overlay } from '@/components/Overlay';
import Popup from '@/components/Popup';
import { Loader2Icon } from 'lucide-react';

interface LugatPopupProps {
  bookKey: string;
}

const POPUP_WIDTH = 320;

interface LugatEntry {
  term: string;
  definition: string;
  arabic?: string;
  level: number;
}

const LugatPopup: React.FC<LugatPopupProps> = ({ bookKey }) => {
  const { t: _ } = useTranslation();
  const [showPopup, setShowPopup] = useState(false);
  const [entry, setEntry] = useState<LugatEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [popupPosition, setPopupPosition] = useState<Position | null>(null);
  const [trianglePosition, setTrianglePosition] = useState<Position | null>(null);

  useEffect(() => {
    const handlePopup = async (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.bookKey !== bookKey) return;

      const element = detail.element as HTMLElement;
      const term = detail.term as string;
      if (!element || !term) return;

      setIsLoading(true);
      setEntry(null);

      let foundEntry: LugatEntry | null = null;

      // Try fetch from public JSON (works on web)
      try {
        const res = await fetch('/data/lugat-terms.json');
        if (res.ok) {
          const data = (await res.json()) as Array<{ t: string; d: string }>;
          const match = data.find((e) => e.t.toLowerCase() === term.toLowerCase());
          if (match) {
            foundEntry = { term: match.t, definition: match.d, level: 3 };
          }
        }
      } catch {
        /* fallback */
      }

      setEntry(foundEntry);
      setIsLoading(false);

      if (!foundEntry) return;

      // Position
      const gridCell = document.querySelector(`[data-book-key="${CSS.escape(bookKey)}"]`);
      if (gridCell) {
        const rect = gridCell.getBoundingClientRect();
        const h = Math.min(180, window.innerHeight - 20);
        setTrianglePosition(getPosition(element, rect, 10, false));
        setPopupPosition(
          getPopupPosition(getPosition(element, rect, 10, false), rect, POPUP_WIDTH, h, 10),
        );
      }

      setShowPopup(true);
    };

    eventDispatcher.on('lugat-popup', handlePopup);
    return () => eventDispatcher.off('lugat-popup', handlePopup);
  }, [bookKey]);

  if (!showPopup || !popupPosition || !trianglePosition) return null;

  return (
    <div role='toolbar' tabIndex={-1}>
      <Overlay onDismiss={() => setShowPopup(false)} />
      <Popup
        width={POPUP_WIDTH}
        height={Math.min(180, window.innerHeight - 20)}
        position={popupPosition}
        trianglePosition={trianglePosition}
        className='select-text'
        onDismiss={() => setShowPopup(false)}
      >
        <div className='flex h-full flex-col overflow-hidden rounded-lg px-4 py-3'>
          {isLoading ? (
            <div className='flex items-center gap-2 py-2 text-xs opacity-40'>
              <Loader2Icon size={14} className='animate-spin' />
              {_('Looking up...')}
            </div>
          ) : entry ? (
            <>
              <div className='mb-1.5 text-sm font-semibold'>{entry.term}</div>
              {entry.arabic && (
                <div
                  dir='rtl'
                  className='mb-1 font-arabic text-sm opacity-50'
                  style={{ fontFamily: '"Traditional Arabic", "Scheherazade New", serif' }}
                >
                  {entry.arabic}
                </div>
              )}
              <div className='text-sm leading-relaxed opacity-80'>{entry.definition}</div>
            </>
          ) : (
            <div className='py-2 text-xs opacity-40'>{_('Not found in dictionary.')}</div>
          )}
        </div>
      </Popup>
    </div>
  );
};

export default LugatPopup;
