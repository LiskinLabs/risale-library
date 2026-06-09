'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getPopupPosition, getPosition, Position } from '@/utils/sel';
import { lookupMeal, getMealLanguage, type MealResult } from '@/services/hasiye/mealIndex';
import { eventDispatcher } from '@/utils/event';
import { Overlay } from '@/components/Overlay';
import Popup from '@/components/Popup';
import { useResponsiveSize } from '@/hooks/useResponsiveSize';
import { useEnv } from '@/context/EnvContext';
import { Loader2Icon, SparklesIcon } from 'lucide-react';

interface HasiyePopupProps {
  bookKey: string;
}

const HasiyePopup: React.FC<HasiyePopupProps> = ({ bookKey }) => {
  const { t: _, i18n } = useTranslation();
  const { appService } = useEnv();
  const [showPopup, setShowPopup] = useState(false);
  const [mealResult, setMealResult] = useState<MealResult | null>(null);
  const [arabicText, setArabicText] = useState('');
  const [popupPosition, setPopupPosition] = useState<Position | null>(null);
  const [trianglePosition, setTrianglePosition] = useState<Position | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAiTranslation, setIsAiTranslation] = useState(false);

  const popupPadding = useResponsiveSize(10);
  const popupWidth = Math.min(460, window.innerWidth - popupPadding * 2);
  const popupHeight = Math.min(420, window.innerHeight - popupPadding * 2);
  const mealLang = useMemo(() => getMealLanguage(i18n.language || 'tr'), [i18n.language]);

  useEffect(() => {
    const handlePopup = async (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.bookKey !== bookKey) return;

      const element = detail.element as HTMLElement;
      const encodedText = detail.encodedText;
      if (!element || !encodedText) return;

      let decodedText = '';
      try {
        const binaryString = atob(encodedText);
        const bytes = Uint8Array.from(binaryString, (c) => c.charCodeAt(0));
        decodedText = new TextDecoder().decode(bytes);
      } catch (_e) {
        console.warn('Failed to decode hasiye text:', _e);
        return;
      }

      // Show popup immediately with loading state
      setArabicText(decodedText);
      setMealResult(null);
      setIsAiLoading(true);
      setIsAiTranslation(false);
      setShowPopup(false);

      let translation = '';
      let reference = '';

      // ── Tier 1: Quran meal lookup ──────────────────────────────
      const result = await lookupMeal(decodedText, mealLang);
      if (result) {
        translation = result.meal;
        reference = result.reference;
        setIsAiLoading(false);
        setIsAiTranslation(false);
      }

      // ── Tier 2: Lugat SQLite fallback ──────────────────────────
      if (!translation && appService) {
        try {
          const db = await appService.openDatabase('lugat', 'lugat.db', 'Data');
          if (db) {
            const words = decodedText
              .split(/[\s،۔؛,]+/)
              .map((w: string) => w.trim())
              .filter((w: string) => w.length >= 3)
              .slice(0, 5);
            const placeholders = words.map(() => '?').join(',');
            const rows = await db.select<{ term: string; definition: string }>(
              `SELECT term, definition FROM lugat WHERE arabic IN (${placeholders}) LIMIT 5`,
              words,
            );
            if (rows?.length) {
              translation = rows.map((r) => `(${r.term}) ${r.definition}`).join(' | ');
              setIsAiLoading(false);
            }
          }
        } catch {
          /* lugat not available */
        }
      }

      // ── Tier 3: AI semantic translation ────────────────────────
      if (!translation) {
        try {
          translation = await fetchAiTranslation(decodedText, mealLang);
          setIsAiTranslation(true);
        } catch (err) {
          console.error('AI translation failed:', err);
          translation = _('Translation unavailable. Try again later.');
        }
        setIsAiLoading(false);
      }

      setMealResult({ meal: translation, reference });

      // Position
      const gridCell = document.querySelector(`[data-book-key="${CSS.escape(bookKey)}"]`);
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
  }, [bookKey, popupPadding, popupWidth, popupHeight, appService, mealLang, _]);

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
          {/* Header */}
          <div className='flex items-center justify-between border-b border-base-content/10 px-4 py-2'>
            <span className='text-sm font-semibold opacity-70'>{_('Meal (Translation)')}</span>
            <div className='flex items-center gap-1'>
              {isAiTranslation && (
                <span className='badge badge-sm gap-1 border-amber-400/40 bg-amber-400/10 text-[10px] text-amber-600'>
                  <SparklesIcon size={10} />
                  AI
                </span>
              )}
              <span className='badge badge-sm text-[10px] opacity-50'>{mealLang.toUpperCase()}</span>
            </div>
          </div>

          {/* Body */}
          <div className='flex-1 overflow-y-auto p-4'>
            {/* Arabic text */}
            <div
              dir='rtl'
              className='mb-3 font-arabic text-xl leading-relaxed opacity-80'
              style={{ fontFamily: '"Traditional Arabic", "Scheherazade New", serif' }}
            >
              {arabicText}
            </div>

            {/* Reference (Quran only) */}
            {mealResult?.reference && (
              <div className='mb-2 text-xs font-medium tracking-wide opacity-50'>
                {mealResult.reference}
              </div>
            )}

            {/* Loading */}
            {isAiLoading && (
              <div className='flex items-center gap-2 py-4 text-sm opacity-50'>
                <Loader2Icon size={16} className='animate-spin' />
                {_('AI is translating...')}
              </div>
            )}

            {/* AI disclaimer */}
            {isAiTranslation && mealResult && (
              <div className='mb-2 text-[10px] leading-tight opacity-40'>
                {_('This is an AI-generated semantic translation. It conveys the meaning in context but is not a literal Quran translation.')}
              </div>
            )}

            {/* Translation text */}
            {mealResult && (
              <div className='text-sm leading-relaxed opacity-90 whitespace-pre-wrap'>
                {mealResult.meal}
              </div>
            )}
          </div>
        </div>
      </Popup>
    </div>
  );
};

// ── AI translation helper ───────────────────────────────────────────

async function fetchAiTranslation(arabicText: string, targetLang: string): Promise<string> {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch('/api/ai/dictionary', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      word: arabicText,
      mode: 'passage',
      targetLang,
      sourceLang: 'ar',
      complexity: 'complex',
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `AI API error: ${res.status}`);
  }

  const data = (await res.json()) as {
    ok?: boolean;
    json?: string;
    error?: string;
  };

  if (data.error) throw new Error(data.error);
  if (!data.json) throw new Error('Empty AI response');

  // Parse the AI's JSON response — it returns a PassageAnalysis object
  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = JSON.parse(data.json) as Record<string, unknown>;
  } catch {
    // Not JSON — return raw markdown
    return data.json;
  }

  // Build a rich formatted response from the parsed AI output
  const parts: string[] = [];

  const summary = (parsed['passageSummary'] || parsed['summary']) as string | undefined;
  const translation = (parsed['approximateTranslation'] || parsed['translation']) as
    | string
    | undefined;
  const context = (parsed['contextNote'] || parsed['note']) as string | undefined;
  const terms = parsed['complexTerms'] as Array<Record<string, string>> | undefined;
  const insight = (parsed['keyInsight'] || parsed['insight']) as string | undefined;

  if (summary) parts.push(`**${summary}**`);
  if (translation) parts.push(`📖 ${translation}`);
  if (context) parts.push(`💡 ${context}`);
  if (insight) parts.push(`✨ ${insight}`);
  if (terms?.length) {
    parts.push('');
    parts.push('**Terms:**');
    for (const t of terms) {
      const term = t['term'] || '';
      const def = t['contextualDefinition'] || t['generalDefinition'] || '';
      if (term && def) parts.push(`• **${term}** — ${def}`);
    }
  }

  return parts.length > 0 ? parts.join('\n\n') : data.json;
}

export default HasiyePopup;
