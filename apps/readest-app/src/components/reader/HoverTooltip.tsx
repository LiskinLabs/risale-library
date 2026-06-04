/**
 * HoverTooltip — compact definition tooltip shown on word hover.
 *
 * Positioned near the cursor with a short definition from the Lugat database.
 * Styled like a native browser tooltip but with Risale-i Nur theming.
 */

import React, { useEffect, useRef } from 'react';

interface HoverTooltipProps {
  word: string;
  definition: string;
  x: number;
  y: number;
  visible: boolean;
  onDismiss: () => void;
}

const HoverTooltip: React.FC<HoverTooltipProps> = ({
  word,
  definition,
  x,
  y,
  visible,
  onDismiss,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  // Position tooltip near cursor, avoiding edge overflow
  useEffect(() => {
    if (!visible || !ref.current) return;
    const el = ref.current;
    const rect = el.getBoundingClientRect();

    let left = x + 12;
    let top = y + 16;

    // Keep within viewport
    if (left + rect.width > window.innerWidth - 10) {
      left = x - rect.width - 12;
    }
    if (top + rect.height > window.innerHeight - 10) {
      top = y - rect.height - 8;
    }

    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  }, [x, y, visible]);

  // Dismiss on scroll or outside click
  useEffect(() => {
    if (!visible) return;
    const dismiss = () => onDismiss();
    window.addEventListener('scroll', dismiss, { passive: true });
    return () => window.removeEventListener('scroll', dismiss);
  }, [visible, onDismiss]);

  if (!visible || !definition) return null;

  // Truncate long definitions
  const shortDef =
    definition.length > 200 ? definition.slice(0, 200).replace(/\s+\S*$/, '') + '…' : definition;

  return (
    <div
      ref={ref}
      className='pointer-events-none fixed z-[9999] select-none'
      style={{ left: x + 12, top: y + 16 }}
    >
      <div
        className='
          bg-base-100/95 text-base-content border-base-300/60
          max-w-[320px] rounded-lg border px-3 py-2
          text-[13px] leading-relaxed shadow-lg backdrop-blur-sm
        '
      >
        <div className='mb-1 text-[11px] font-semibold opacity-50'>{word}</div>
        <div className='line-clamp-4 text-[13px] leading-snug opacity-80'>{shortDef}</div>
        <div className='mt-1.5 text-[10px] opacity-35'>Risale Lugat</div>
      </div>
    </div>
  );
};

export default HoverTooltip;
