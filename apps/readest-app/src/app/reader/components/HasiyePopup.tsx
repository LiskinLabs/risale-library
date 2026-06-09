'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdArrowBack } from 'react-icons/md';
import { getPopupPosition, getPosition, Position } from '@/utils/sel';
import { lookupMeal, getMealLanguage, type MealResult } from '@/services/hasiye/mealIndex';
import { eventDispatcher } from '@/utils/event';
import { Overlay } from '@/components/Overlay';
import Popup from '@/components/Popup';
import { useEnv } from '@/context/EnvContext';
import { Loader2Icon, SparklesIcon, BookOpenIcon } from 'lucide-react';

interface HasiyePopupProps {
  bookKey: string;
}

const POPUP_WIDTH = 480;
const POPUP_MAX_HEIGHT = 500;

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
  const bodyRef = useRef<HTMLDivElement>(null);
  const [bodyHeight, setBodyHeight] = useState(200);

  const mealLang = useMemo(() => getMealLanguage(i18n.language || 'tr'), [i18n.language]);

  // Auto-size height to content
  useEffect(() => {
    if (bodyRef.current && mealResult) {
      const h = bodyRef.current.scrollHeight + 56; // header
      setBodyHeight(Math.min(h, POPUP_MAX_HEIGHT));
    }
  }, [mealResult, isAiLoading]);

  useEffect(() => {
    const handlePopup = async (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.bookKey !== bookKey) return;

      const element = detail.element as HTMLElement;
      const encodedText = detail.encodedText;
      if (!element || !encodedText) return;

      let decodedText = '';
      try {
        decodedText = new TextDecoder().decode(
          Uint8Array.from(atob(encodedText), (c) => c.charCodeAt(0)),
        );
      } catch {
        return;
      }

      setIsAiLoading(true);
      setIsAiTranslation(false);
      setMealResult(null);
      setArabicText(decodedText);

      let translation = '';
      let reference = '';

      // Tier 1: Quran meal
      const result = await lookupMeal(decodedText, mealLang);
      if (result) {
        translation = result.meal;
        reference = result.reference;
        setIsAiLoading(false);
      }

      // Tier 2: Lugat SQLite
      if (!translation && appService) {
        try {
          const db = await appService.openDatabase('lugat', 'lugat.db', 'Data');
          if (db) {
            const words = decodedText.split(/[\s،۔؛,]+/).filter((w: string) => w.trim().length >= 3).slice(0, 5);
            const ph = words.map(() => '?').join(',');
            const rows = await db.select<{ term: string; definition: string }>(
              `SELECT term, definition FROM lugat WHERE arabic IN (${ph}) LIMIT 3`, words);
            if (rows?.length) {
              translation = rows.map((r) => `(${r.term}) ${r.definition}`).join(' | ');
              setIsAiLoading(false);
            }
          }
        } catch { /* */ }
      }

      // Tier 3: AI
      if (!translation) {
        try {
          translation = await fetchAiTranslation(decodedText, mealLang);
          setIsAiTranslation(true);
        } catch (err) {
          console.error('AI translate error:', err);
          translation = _('Translation unavailable.');
        }
        setIsAiLoading(false);
      }

      setMealResult({ meal: translation, reference });

      // Position
      const gridCell = document.querySelector(`[data-book-key="${CSS.escape(bookKey)}"]`);
      if (gridCell) {
        const rect = gridCell.getBoundingClientRect();
        const w = Math.min(POPUP_WIDTH, window.innerWidth - 20);
        setTrianglePosition(getPosition(element, rect, 10, false));
        setPopupPosition(getPopupPosition(getPosition(element, rect, 10, false), rect, w, bodyHeight, 10));
      }

      setShowPopup(true);
    };

    eventDispatcher.on('hasiye-popup', handlePopup);
    return () => eventDispatcher.off('hasiye-popup', handlePopup);
  }, [bookKey, appService, mealLang, bodyHeight, _]);

  if (!showPopup || !popupPosition || !trianglePosition) return null;

  const headerLabel = isAiTranslation
    ? _('AI Translation')
    : mealResult?.reference
      ? _('Meal (Translation)')
      : _('Dictionary');

  return (
    <div role='toolbar' tabIndex={-1}>
      <Overlay onDismiss={() => setShowPopup(false)} />
      <Popup
        width={POPUP_WIDTH}
        height={bodyHeight}
        position={popupPosition}
        trianglePosition={trianglePosition}
        className='select-text'
        onDismiss={() => setShowPopup(false)}
      >
        <div className='flex h-full flex-col overflow-hidden rounded-lg pt-4' ref={bodyRef}>
          {/* Compact header — matches Dictionary style */}
          <div className='-mt-2 flex items-center gap-2 px-4 pb-2'>
            <button
              type='button'
              onClick={() => setShowPopup(false)}
              className='btn btn-ghost btn-circle btn-xs flex shrink-0'
              title={_('Close')}
            >
              <MdArrowBack size={16} />
            </button>
            <span className='min-w-0 flex-1 truncate text-sm font-semibold opacity-70'>
              {headerLabel}
            </span>
            <div className='flex shrink-0 items-center gap-1'>
              {isAiTranslation && (
                <span className='badge badge-xs gap-0.5 border-amber-400/40 bg-amber-400/10 text-[9px] text-amber-600'>
                  <SparklesIcon size={9} /> AI
                </span>
              )}
              {mealResult?.reference && (
                <span className='flex items-center gap-0.5 text-[10px] opacity-40'>
                  <BookOpenIcon size={10} />
                  {mealResult.reference}
                </span>
              )}
            </div>
          </div>

          {/* Body — compact, auto-sized */}
          <div className='min-h-0 flex-1 overflow-y-auto px-4 pb-4'>
            {/* Arabic text — smaller, inline */}
            <div
              dir='rtl'
              className='mb-2 font-arabic text-lg leading-relaxed opacity-75'
              style={{ fontFamily: '"Traditional Arabic", "Scheherazade New", serif' }}
            >
              {arabicText}
            </div>

            {isAiLoading && (
              <div className='flex items-center gap-2 py-2 text-xs opacity-40'>
                <Loader2Icon size={14} className='animate-spin' />
                {_('Translating...')}
              </div>
            )}

            {isAiTranslation && (
              <div className='mb-2 text-[9px] leading-tight opacity-30'>
                {_('AI-generated semantic translation — conveys meaning in context, not literal.')}
              </div>
            )}

            {mealResult && (
              <div className='text-sm leading-relaxed whitespace-pre-wrap'>
                {mealResult.meal}
              </div>
            )}
          </div>
        </div>
      </Popup>
    </div>
  );
};

// ── AI helper ───────────────────────────────────────────────────────

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

  if (!res.ok) throw new Error(`AI API: ${res.status}`);
  const data = (await res.json()) as { ok?: boolean; json?: string; error?: string };
  if (data.error) throw new Error(data.error);
  if (!data.json) throw new Error('Empty response');

  let parsed: Record<string, unknown> | null = null;
  try { parsed = JSON.parse(data.json) as Record<string, unknown>; } catch { return data.json; }

  const parts: string[] = [];
  const summary = parsed['passageSummary'] || parsed['summary'] as string | undefined;
  const translation = parsed['approximateTranslation'] || parsed['translation'] as string | undefined;
  const context = parsed['contextNote'] || parsed['note'] as string | undefined;
  const insight = parsed['keyInsight'] || parsed['insight'] as string | undefined;
  const terms = parsed['complexTerms'] as Array<Record<string, string>> | undefined;

  if (summary) parts.push(`**${summary}**`);
  if (translation) parts.push(`📖 ${translation}`);
  if (context) parts.push(`💡 ${context}`);
  if (insight) parts.push(`✨ ${insight}`);
  if (terms?.length) {
    parts.push('');
    for (const t of terms) {
      const term = t['term'] || '';
      const def = t['contextualDefinition'] || t['generalDefinition'] || '';
      if (term && def) parts.push(`• **${term}** — ${def}`);
    }
  }
  return parts.length > 0 ? parts.join('\n\n') : data.json;
}

export default HasiyePopup;
