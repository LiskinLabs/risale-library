import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { getPopupPosition, getPosition, Position } from '@/utils/sel';
import { lookupMeal } from '@/services/hasiye/mealIndex';
import { eventDispatcher } from '@/utils/event';
import { Overlay } from '@/components/Overlay';
import Popup from '@/components/Popup';
import { useResponsiveSize } from '@/hooks/useResponsiveSize';

interface HasiyePopupProps {
  bookKey: string;
}

const HasiyePopup: React.FC<HasiyePopupProps> = ({ bookKey }) => {
  const _ = useTranslation();
  const [showPopup, setShowPopup] = useState(false);
  const [translationText, setTranslationText] = useState('');
  const [arabicText, setArabicText] = useState('');
  const [popupPosition, setPopupPosition] = useState<Position | null>(null);
  const [trianglePosition, setTrianglePosition] = useState<Position | null>(null);
  const [gridRect, setGridRect] = useState<DOMRect | null>(null);

  const popupPadding = useResponsiveSize(10);
  const maxWidth = Math.min(400, window.innerWidth - popupPadding * 2);
  const maxHeight = Math.min(300, window.innerHeight - popupPadding * 2);

  useEffect(() => {
    const handlePopup = (e: CustomEvent) => {
      const detail = e.detail;
      if (detail.bookKey !== bookKey) return;

      const element = detail.element as HTMLElement;
      const encodedText = detail.encodedText;
      if (!element || !encodedText) return;

      const decodedText = Buffer.from(encodedText, 'base64').toString('utf-8');
      const meal = lookupMeal(decodedText);

      if (!meal) {
        console.log('No meal found for:', decodedText);
        return;
      }

      setArabicText(decodedText);
      setTranslationText(meal);

      const gridCell = document.getElementById(`gridcell-${bookKey}`);
      if (gridCell) {
        const rect = gridCell.getBoundingClientRect();
        setGridRect(rect);

        const point = getPosition(element, rect);
        const trianglePos = getPopupPosition(element, point, rect);
        setTrianglePosition(trianglePos);
        setPopupPosition({ ...trianglePos });
      }

      setShowPopup(true);
    };

    eventDispatcher.on('hasiye-popup', handlePopup);
    return () => {
      eventDispatcher.off('hasiye-popup', handlePopup);
    };
  }, [bookKey]);

  if (!showPopup || !popupPosition || !trianglePosition) return null;

  return (
    <>
      <Overlay onDismiss={() => setShowPopup(false)} />
      <Popup
        point={popupPosition.point}
        dir={popupPosition.dir}
        maxWidth={maxWidth}
        maxHeight={maxHeight}
        trianglePosition={trianglePosition}
        className='hasiye-popup-container'
      >
        <div
          id='popup-container'
          className='bg-base-100 flex h-full w-full flex-col overflow-hidden rounded shadow-lg'
          style={{ width: maxWidth, maxHeight: maxHeight }}
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
            <div className='text-sm leading-relaxed opacity-90'>{translationText}</div>
          </div>
        </div>
      </Popup>
    </>
  );
};

export default HasiyePopup;
