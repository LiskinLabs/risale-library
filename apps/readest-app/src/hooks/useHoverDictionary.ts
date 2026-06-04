/**
 * useHoverDictionary — hover-based word lookup tooltip.
 *
 * When the user hovers over a word in the reader iframe, this hook:
 *   1. Detects the word under the cursor (via injected iframe script)
 *   2. Looks up the definition in meaningMode's IndexedDB cache
 *   3. Shows a compact tooltip near the cursor
 *
 * The tooltip auto-dismisses when the cursor moves away.
 * Uses the same data as meaningMode transformer (38K+ terms).
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface HoverWordMessage {
  type: 'hover-word';
  word: string;
  x: number;
  y: number;
}

interface HoverTooltipState {
  word: string;
  definition: string;
  x: number;
  y: number;
  visible: boolean;
}

const IDB_NAME = 'risale-meaning-cache';
const IDB_STORE = 'terms';
const TOOLTIP_DELAY = 400; // ms before showing tooltip
const TOOLTIP_HIDE_DELAY = 300; // ms after mouse leaves before hiding

export function useHoverDictionary(iframeRef: React.RefObject<HTMLIFrameElement | null>) {
  const [tooltip, setTooltip] = useState<HoverTooltipState>({
    word: '',
    definition: '',
    x: 0,
    y: 0,
    visible: false,
  });

  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentWordRef = useRef<string>('');

  // ── IndexedDB lookup ────────────────────────────────────────────────

  const lookupWord = useCallback(async (word: string): Promise<string> => {
    try {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open(IDB_NAME, 1);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        req.onupgradeneeded = () => {
          req.result.createObjectStore(IDB_STORE, { keyPath: 'term' });
        };
      });

      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const getReq = store.get(word.toLowerCase());

      const result = await new Promise<{ term: string; definition: string } | undefined>(
        (resolve, reject) => {
          getReq.onsuccess = () => resolve(getReq.result);
          getReq.onerror = () => reject(getReq.error);
        },
      );

      db.close();
      return result?.definition || '';
    } catch {
      return '';
    }
  }, []);

  // ── Message handler ─────────────────────────────────────────────────

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      const data = event.data as HoverWordMessage | undefined;
      if (!data || data.type !== 'hover-word') return;

      const { word, x, y } = data;
      if (!word || word.length < 3) return;

      // Don't re-trigger for the same word
      if (word === currentWordRef.current) return;
      currentWordRef.current = word;

      // Clear existing timers
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

      // Debounce: wait before showing
      hoverTimerRef.current = setTimeout(async () => {
        const definition = await lookupWord(word);
        if (definition && currentWordRef.current === word) {
          setTooltip({ word, definition, x, y, visible: true });
        }
      }, TOOLTIP_DELAY);
    },
    [lookupWord],
  );

  // ── Hide tooltip ────────────────────────────────────────────────────

  const hideTooltip = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      currentWordRef.current = '';
      setTooltip((prev) => ({ ...prev, visible: false }));
    }, TOOLTIP_HIDE_DELAY);
  }, []);

  // ── Inject hover detection script into iframe ───────────────────────

  const injectHoverScript = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    const script = `
(function() {
  if (window.__hoverDictionaryInjected) return;
  window.__hoverDictionaryInjected = true;

  let lastWord = '';
  let lastX = 0;
  let lastY = 0;
  let throttleTimer = null;

  function getWordAtPoint(x, y) {
    // Use document.caretRangeFromPoint (WebKit) or document.caretPositionFromPoint (Firefox)
    const range = document.caretRangeFromPoint
      ? document.caretRangeFromPoint(x, y)
      : null;
    if (!range) return null;

    // Expand to word boundaries
    const textNode = range.startContainer;
    if (textNode.nodeType !== Node.TEXT_NODE) return null;

    const text = textNode.textContent || '';
    let start = range.startOffset;
    let end = range.startOffset;

    // Find word start
    while (start > 0 && /[\\wÀ-ÖØ-öø-ÿ'\\u0600-\\u06FF]/.test(text[start - 1] || '')) {
      start--;
    }
    // Find word end
    while (end < text.length && /[\\wÀ-ÖØ-öø-ÿ'\\u0600-\\u06FF]/.test(text[end] || '')) {
      end++;
    }

    const word = text.slice(start, end).trim();
    if (word.length < 2) return null;
    // Skip pure numbers/punctuation
    if (/^[\\d.,;:!?\\-]+$/.test(word)) return null;

    return word;
  }

  document.addEventListener('mousemove', function(e) {
    if (throttleTimer) return;
    throttleTimer = setTimeout(function() {
      throttleTimer = null;

      const word = getWordAtPoint(e.clientX, e.clientY);
      if (!word) {
        if (lastWord) {
          window.parent.postMessage({ type: 'hover-leave' }, '*');
          lastWord = '';
        }
        return;
      }

      if (word !== lastWord || Math.abs(e.clientX - lastX) > 20 || Math.abs(e.clientY - lastY) > 10) {
        lastWord = word;
        lastX = e.clientX;
        lastY = e.clientY;
        window.parent.postMessage({
          type: 'hover-word',
          word: word,
          x: e.clientX,
          y: e.clientY,
        }, '*');
      }
    }, 150); // throttle: check every 150ms
  }, { passive: true });

  // Mouse leave on body — hide tooltip
  document.addEventListener('mouseleave', function() {
    window.parent.postMessage({ type: 'hover-leave' }, '*');
    lastWord = '';
  });
})();
`;

    try {
      iframe.contentWindow.eval(script);
    } catch (err) {
      console.warn('[HoverDict] Failed to inject hover script:', err);
    }
  }, [iframeRef]);

  // ── Listen for messages ─────────────────────────────────────────────

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  // Handle hover-leave messages
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'hover-leave') {
        hideTooltip();
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [hideTooltip]);

  // ── Cleanup ─────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  return { tooltip, injectHoverScript, hideTooltip };
}
