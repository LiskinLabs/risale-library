'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { getPopupPosition, getPosition, Position } from '@/utils/sel';
import { lookupMeal } from '@/services/hasiye/mealIndex';
import { eventDispatcher } from '@/utils/event';
import { Overlay } from '@/components/Overlay';
import Popup from '@/components/Popup';
import { useResponsiveSize } from '@/hooks/useResponsiveSize';
import { useEnv } from '@/context/EnvContext';

interface HasiyePopupProps {
  bookKey: string;
}

const HasiyePopup: React.FC<HasiyePopupProps> = ({ bookKey }) => {
  const _ = useTranslation();
  const { appService } = useEnv();
  const [showPopup, setShowPopup] = useState(false);
  const [translationText, setTranslationText] = useState('');
  const [arabicText, setArabicText] = useState('');
  const [popupPosition, setPopupPosition] = useState<Position | null>(null);
  const [trianglePosition, setTrianglePosition] = useState<Position | null>(null);

  const popupPadding = useResponsiveSize(10);
  const popupWidth = Math.min(400, window.innerWidth - popupPadding * 2);
  const popupHeight = Math.min(300, window.innerHeight - popupPadding * 2);

  useEffect(() => {
    const handlePopup = async (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.bookKey !== bookKey) return;

      const element = detail.element as HTMLElement;
      const encodedText = detail.encodedText;
      if (!element || !encodedText) return;

      let decodedText = '';
      try {
        // Universal way to decode base64 utf-8
        decodedText = decodeURIComponent(escape(atob(encodedText)));
      } catch (_e) {
        // Fallback for cases where it's just plain ascii base64
        try {
          decodedText = atob(encodedText);
        } catch (e2) {
          console.warn('Failed to decode hasiye text:', e2);
          return;
        }
      }

      let translation = lookupMeal(decodedText);

      // Try Lugat fallback for Arabic/Farsi phrases
      if (!translation && appService) {
        try {
          const db = await appService.openDatabase('lugat', 'lugat.db', 'Data');
          if (db) {
            const results = await db.select<{ term: string; definition: string }>(
              'SELECT term, definition FROM lugat WHERE arabic = ? LIMIT 1',
              [decodedText.trim()],
            );
            if (results && results.length > 0 && results[0]) {
              const entry = results[0];
              translation = `(${entry.term}) ${entry.definition}`;
            }
          }
        } catch (err) {
          console.error('Lugat fallback failed', err);
        }
      }

      if (!translation) {
        console.log('No meal or lugat found for:', decodedText);
        return;
      }

      setArabicText(decodedText);
      setTranslationText(translation);

      const gridCell = document.getElementById(`gridcell-${bookKey}`);
      if (gridCell) {
        const rect = gridCell.getBoundingClientRect();

        const triangPos = getPosition(element, rect, popupPadding, false);
        const popPos = getPopupPosition(triangPos, rect, popupWidth, popupHeight, popupPadding);

        setTrianglePosition(triangPos);
        setPopupPosition(popPos);
      }

      setShowPopup(true);
    };

    eventDispatcher.on('hasiye-popup', handlePopup);
    return () => {
      eventDispatcher.off('hasiye-popup', handlePopup);
    };
  }, [bookKey, popupPadding, popupWidth, popupHeight, appService]);

  if (!showPopup || !popupPosition || !trianglePosition) return null;

  return (
    <div role='toolbar' tabIndex={-1}>
      {showPopup && <Overlay onDismiss={() => setShowPopup(false)} />}
      <Popup
        isOpen={showPopup}
        width={popupWidth}
        height={popupHeight}
        position={popupPosition}
        trianglePosition={trianglePosition}
        className='hasiye-popup-container'
        onDismiss={() => setShowPopup(false)}
      >
        <div
          id='popup-container'
          className='bg-base-100 flex h-full w-full flex-col overflow-hidden rounded shadow-lg'
          style={{ width: popupWidth, maxHeight: popupHeight }}
        >
          <div className='flex items-center border-b border-base-content/10 px-4 py-2'>
            <span className='text-sm font-semibold opacity-70'>{_('Meal (Translation)')}</span>
          </div>
          <div className='flex-1 overflow-y-auto p-4'>
            <div
              dir='rtl'
              className='mb-3 font-arabic text-xl opacity-80'
              style={{ fontFamily: '"Traditional Arabic", "Scheherazade New", serif' }}
            >
              {arabicText}
            </div>
            <div className='text-sm leading-relaxed opacity-90 whitespace-pre-wrap'>
              {translationText}
            </div>
          </div>
        </div>
      </Popup>
    </div>
  );
};

export default HasiyePopup;
