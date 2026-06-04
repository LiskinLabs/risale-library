/**
 * HoverDictionaryOverlay — lightweight hover-to-lookup for the reader.
 *
 * Finds the reader iframe (by [data-book-key]), injects a hover-detection
 * script, listens for word-hover messages, looks up definitions in the
 * meaningMode IndexedDB cache, and renders a compact tooltip.
 *
 * Usage: <HoverDictionaryOverlay bookKey="..." />
 * Place inside the reader component tree.
 */

'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

interface TooltipState {
  word: string;
  definition: string;
  x: number;
  y: number;
  show: boolean;
}

const IDB_NAME = 'risale-meaning-cache';
const IDB_STORE = 'terms';
const DELAY = 350; // ms before showing
const HIDE_DELAY = 250; // ms before hiding

const HoverDictionaryOverlay: React.FC<{ bookKey: string }> = ({ bookKey }) => {
  const [tip, setTip] = useState<TooltipState>({
    word: '',
    definition: '',
    x: 0,
    y: 0,
    show: false,
  });
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastWord = useRef<string>('');
  const injectedRef = useRef<string>('');
  const tipRef = useRef<HTMLDivElement>(null);

  // ── IDB lookup ──────────────────────────────────────────────────────

  const lookup = useCallback(async (word: string): Promise<string> => {
    try {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const r = indexedDB.open(IDB_NAME, 1);
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
        r.onupgradeneeded = () => r.result.createObjectStore(IDB_STORE, { keyPath: 'term' });
      });
      const getReq = db
        .transaction(IDB_STORE, 'readonly')
        .objectStore(IDB_STORE)
        .get(word.toLowerCase());
      const entry = await new Promise<{ term: string; definition: string } | undefined>(
        (resolve, reject) => {
          getReq.onsuccess = () => resolve(getReq.result);
          getReq.onerror = () => reject(getReq.error);
        },
      );
      db.close();
      return entry?.definition || '';
    } catch {
      return '';
    }
  }, []);

  // ── Show / hide ─────────────────────────────────────────────────────

  const show = useCallback((word: string, def: string, x: number, y: number) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    lastWord.current = word;
    hoverTimer.current = setTimeout(() => {
      setTip({ word, definition: def, x, y, show: true });
    }, DELAY);
  }, []);

  const hide = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hideTimer.current = setTimeout(() => {
      lastWord.current = '';
      setTip((p) => ({ ...p, show: false }));
    }, HIDE_DELAY);
  }, []);

  // ── Position tooltip to stay in viewport ────────────────────────────

  useEffect(() => {
    if (!tip.show || !tipRef.current) return;
    const el = tipRef.current;
    const r = el.getBoundingClientRect();
    let left = tip.x + 14;
    let top = tip.y + 18;
    if (left + r.width > window.innerWidth - 8) left = tip.x - r.width - 14;
    if (top + r.height > window.innerHeight - 8) top = tip.y - r.height - 10;
    el.style.left = `${Math.max(4, left)}px`;
    el.style.top = `${Math.max(4, top)}px`;
  }, [tip]);

  // ── Message handler ─────────────────────────────────────────────────

  useEffect(() => {
    const handler = async (e: MessageEvent) => {
      const d = e.data;
      if (!d || d.type !== 'hover-word' || d.bookKey !== bookKey) return;
      const { word, x, y } = d;
      if (!word || word.length < 3 || word === lastWord.current) return;
      const def = await lookup(word);
      if (def) show(word, def, x, y);
    };
    const leaveHandler = (e: MessageEvent) => {
      if (e.data?.type === 'hover-leave' && e.data?.bookKey === bookKey) hide();
    };
    window.addEventListener('message', handler);
    window.addEventListener('message', leaveHandler);
    return () => {
      window.removeEventListener('message', handler);
      window.removeEventListener('message', leaveHandler);
    };
  }, [bookKey, lookup, show, hide]);

  // ── Inject hover script into iframe ─────────────────────────────────

  useEffect(() => {
    if (injectedRef.current === bookKey) return;
    const timer = setInterval(() => {
      const iframe = document.querySelector(
        `iframe[data-book-key="${CSS.escape(bookKey)}"]`,
      ) as HTMLIFrameElement | null;
      if (!iframe?.contentWindow) return;

      try {
        // JSON.stringify for safe serialization — prevents injection via bookKey
        const safeKey = JSON.stringify(bookKey);
        iframe.contentWindow.eval(`
(function() {
  if (window.__hoverDictV2) return;
  window.__hoverDictV2 = true;
  var lastWord = '';
  var throttle = null;

  function getWordAt(x, y) {
    if (!document.caretRangeFromPoint) return null;
    var range = document.caretRangeFromPoint(x, y);
    if (!range || range.startContainer.nodeType !== Node.TEXT_NODE) return null;
    var text = range.startContainer.textContent || '';
    var s = range.startOffset, e = range.startOffset;
    while (s > 0 && /[\\\\wÀ-ÖØ-öø-ÿ'\\\\u0600-\\\\u06FF]/.test(text[s-1]||'')) s--;
    while (e < text.length && /[\\\\wÀ-ÖØ-öø-ÿ'\\\\u0600-\\\\u06FF]/.test(text[e]||'')) e++;
    var w = text.slice(s, e).trim();
    if (w.length < 2 || /^[\\\\d.,;:!?\\\\-]+$/.test(w)) return null;
    return w;
  }

  document.addEventListener('mousemove', function(e) {
    if (throttle) return;
    throttle = setTimeout(function() {
      throttle = null;
      var w = getWordAt(e.clientX, e.clientY);
      if (!w) { if (lastWord) { window.parent.postMessage({ type:'hover-leave', bookKey:${safeKey} }, '*'); lastWord=''; } return; }
      if (w !== lastWord) {
        lastWord = w;
        window.parent.postMessage({ type:'hover-word', word:w, x:e.clientX, y:e.clientY, bookKey:${safeKey} }, '*');
      }
    }, 180);
  }, { passive:true });

  document.addEventListener('mouseleave', function() {
    window.parent.postMessage({ type:'hover-leave', bookKey:${safeKey} }, '*');
    lastWord = '';
  });
})();
`);
        injectedRef.current = bookKey;
        clearInterval(timer);
      } catch {
        /* iframe not ready yet */
      }
    }, 500);

    return () => clearInterval(timer);
  }, [bookKey]);

  // ── Cleanup ─────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  // ── Render ──────────────────────────────────────────────────────────

  if (!tip.show || !tip.definition) return null;

  const short =
    tip.definition.length > 180
      ? tip.definition.slice(0, 180).replace(/\s+\S*$/, '') + '…'
      : tip.definition;

  return (
    <div
      ref={tipRef}
      className='pointer-events-none fixed z-[9999] select-none'
      style={{ left: tip.x + 14, top: tip.y + 18 }}
    >
      <div className='bg-base-100/95 text-base-content border-base-300/50 max-w-[300px] rounded-lg border px-3 py-2 text-[13px] leading-relaxed shadow-lg backdrop-blur-sm'>
        <div className='mb-1 text-[11px] font-semibold opacity-45'>{tip.word}</div>
        <div className='line-clamp-4 text-[13px] leading-snug opacity-80'>{short}</div>
        <div className='mt-1.5 text-[10px] opacity-30'>Risale Lugat</div>
      </div>
    </div>
  );
};

export default HoverDictionaryOverlay;
