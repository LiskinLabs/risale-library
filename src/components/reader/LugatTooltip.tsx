import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { selectedWord, lugatPopupPosition, isRightSidebarOpen } from '../../stores/readerStore';

export const LugatTooltip: React.FC = () => {
  const selected = useStore(selectedWord);
  const position = useStore(lugatPopupPosition);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [styles, setStyles] = useState<React.CSSProperties>({ visibility: 'hidden' });

  useEffect(() => {
    if (selected && position) {
      // Small delay to ensure position is correct after render
      const updatePosition = () => {
        if (!tooltipRef.current) return;

        const tooltipWidth = tooltipRef.current.offsetWidth || 280;
        const tooltipHeight = tooltipRef.current.offsetHeight || 150;

        let x = position.x;
        let y = position.y - 10; // Show above

        // Constrain to viewport
        const padding = 20;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // X constraint
        if (x - tooltipWidth / 2 < padding) {
          x = tooltipWidth / 2 + padding;
        } else if (x + tooltipWidth / 2 > vw - padding) {
          x = vw - tooltipWidth / 2 - padding;
        }

        // Y constraint (flip if no space above)
        let placement: 'top' | 'bottom' = 'top';
        if (y - tooltipHeight < padding) {
          y = position.y + 25; // Show below
          placement = 'bottom';
        }

        setStyles({
          left: `${x}px`,
          top: `${y}px`,
          transform: placement === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
          visibility: 'visible',
          opacity: 1,
        });
      };

      requestAnimationFrame(updatePosition);
    } else {
      setStyles({ visibility: 'hidden', opacity: 0 });
    }
  }, [selected, position]);

  const handleClose = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    selectedWord.set(null);
    lugatPopupPosition.set(null);
  };

  if (!selected) return null;

  return (
    <>
      {/* Invisible backdrop for closing on click outside */}
      <div className='fixed inset-0 z-[90]' onMouseDown={handleClose} onTouchStart={handleClose} />

      <div
        ref={tooltipRef}
        className='glass-panel lugat-tooltip fixed z-[100] shadow-2xl transition-all duration-200'
        style={{
          ...styles,
          width: '300px',
          maxWidth: '90vw',
          padding: '1.2rem',
          borderRadius: '16px',
          pointerEvents: 'auto',
          border: '1px solid var(--accent)',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className='flex flex-col gap-2'>
          <div className='mb-1 flex items-center justify-between border-b border-black/5 pb-2 dark:border-white/5'>
            <span className='text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]'>
              Значение слова
            </span>
            <button
              onClick={handleClose}
              className='rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/5'
            >
              <svg
                width='14'
                height='14'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2.5'
              >
                <path d='M18 6L6 18M6 6l12 12' />
              </svg>
            </button>
          </div>

          <h3
            className='m-0 text-xl font-black italic text-[var(--text-primary)]'
            style={{ fontFamily: 'var(--reader-font)' }}
          >
            {selected.word}
          </h3>

          <div className='lugat-tooltip-body scrollbar-thin max-h-[200px] overflow-y-auto pr-1'>
            <p
              className='m-0 text-[15px] leading-relaxed text-[var(--text-secondary)]'
              style={{ fontFamily: 'var(--reader-font)' }}
            >
              {selected.meaning}
            </p>
          </div>
        </div>

        {/* Arrow / Tip */}
        <div
          className='absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b border-r border-[var(--accent)] bg-[var(--glass-bg)]'
          style={{
            clipPath: styles.transform?.includes('-100%')
              ? 'none'
              : 'polygon(0 0, 100% 0, 100% 100%)',
            top: styles.transform?.includes('-100%') ? 'auto' : '-8px',
            bottom: styles.transform?.includes('-100%') ? '-8px' : 'auto',
            transform: styles.transform?.includes('-100%')
              ? 'translateX(-50%) rotate(45deg)'
              : 'translateX(-50%) rotate(-135deg)',
          }}
        />
      </div>
    </>
  );
};
