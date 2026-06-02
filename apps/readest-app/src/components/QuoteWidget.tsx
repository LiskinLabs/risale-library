import React, { useState, useEffect, useCallback } from 'react';
import { getQuoteById, getDailyQuote, getRandomQuote, Vecize } from '@/services/quotes';
import { useTranslation } from '@/hooks/useTranslation';

interface QuoteWidgetProps {
  className?: string;
  compact?: boolean;
}

/**
 * Quote of the Day / Vecize Widget
 *
 * Displays a curated quote from Risale-i Nur on the library home screen.
 * Shows the daily quote by default, with refresh and share controls.
 */
const QuoteWidget: React.FC<QuoteWidgetProps> = ({ className, compact }) => {
  const _ = useTranslation();
  const [quote, setQuote] = useState<Vecize | null>(null);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    const daily = getDailyQuote();
    setQuote(daily);
    setTimeout(() => setFadeIn(true), 100);
  }, []);

  const handleRefresh = useCallback(() => {
    setFadeIn(false);
    setTimeout(() => {
      setQuote(getRandomQuote());
      setFadeIn(true);
    }, 200);
  }, []);

  const handleShare = useCallback(() => {
    if (!quote) return;
    const shareText = `"${quote.text}"\n— ${quote.book}${quote.section ? `, ${quote.section}` : ''}\n\n📖 Risale AI Studio`;
    if (navigator.share) {
      navigator.share({ text: shareText, title: _('Risale-i Nur Vecizesi') }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(shareText);
    }
  }, [quote, _]);

  if (!quote) return null;

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-base-200 to-secondary/5
        border border-base-300/50 dark:border-base-700/30
        ${compact ? 'p-3' : 'p-4 sm:p-5'} ${className || ''}`}
    >
      {/* Decorative quote mark */}
      <span className='absolute top-2 left-3 text-5xl font-serif text-primary/10 select-none leading-none'>
        &ldquo;
      </span>

      {/* Quote text */}
      <blockquote
        className={`relative z-10 transition-opacity duration-500 ${fadeIn ? 'opacity-100' : 'opacity-0'}
          ${compact ? 'text-xs leading-relaxed' : 'text-sm sm:text-base leading-relaxed'}`}
      >
        <p className='font-serif italic text-base-content/90 mb-2 pl-4'>{quote.text}</p>
        <footer className='text-xs text-base-content/50 flex items-center justify-between pl-4'>
          <span>
            — {quote.book}
            {quote.section && <span className='hidden sm:inline'>, {quote.section}</span>}
          </span>

          {!compact && (
            <span className='flex gap-2'>
              <button
                onClick={handleRefresh}
                className='opacity-50 hover:opacity-100 transition-opacity text-xs'
                aria-label={_('New quote')}
                title={_('Show another quote')}
              >
                ↻
              </button>
              <button
                onClick={handleShare}
                className='opacity-50 hover:opacity-100 transition-opacity text-xs'
                aria-label={_('Share quote')}
                title={_('Share this quote')}
              >
                ↗
              </button>
            </span>
          )}
        </footer>
      </blockquote>

      {/* Bottom gradient line */}
      <div className='absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary/30 via-secondary/30 to-primary/30' />
    </div>
  );
};

export default QuoteWidget;
