import { useEffect, useRef } from 'react';
import { FoliateView } from '@/types/view';
import { useReaderStore } from '@/store/readerStore';
import { lugatService } from '@/services/lugatService';
import { getLocale } from '@/utils/misc';
import { walkTextNodes } from '@/utils/walk';
import { debounce } from '@/utils/debounce';

type FoliateViewExtended = FoliateView & {
  renderer?: {
    doc: Document;
  };
};

export function useLugatHighlight(
  bookKey: string,
  view: FoliateViewExtended | HTMLElement | null,
  enabled = true,
  onWordClick: (word: string, lang: string) => void,
) {
  const { getProgress } = useReaderStore();
  const progress = getProgress(bookKey);

  const activeEnabled = enabled; // can derive from settings if needed

  // To avoid highlighting the same text node multiple times
  const processedElements = useRef<Set<HTMLElement>>(new Set());
  const processingRef = useRef(false);
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    // initialize metadata
    lugatService.loadMetadata();
  }, []);

  const highlightWords = async () => {
    if (!view || !activeEnabled || processingRef.current) return;
    processingRef.current = true;

    try {
      const doc =
        'renderer' in view && view.renderer
          ? view.renderer.doc
          : (view as HTMLElement).ownerDocument;
      if (!doc) return;

      const nodes = walkTextNodes(view as HTMLElement, ['pre', 'code', 'math', 'ruby', 'rt']);

      for (const node of nodes) {
        if (!node.textContent || node.textContent.trim().length === 0) continue;

        // Skip nodes inside already highlighted elements or other skipped tags
        let parent = node.parentElement;
        let shouldSkip = false;
        while (parent && parent !== view && parent !== doc.body) {
          if (
            parent.tagName === 'A' ||
            parent.classList.contains('lugat-highlight') ||
            processedElements.current.has(parent)
          ) {
            shouldSkip = true;
            break;
          }
          parent = parent.parentElement;
        }
        if (shouldSkip) continue;

        // Extract words. Simple regex for word boundaries
        // This regex matches Ottoman/Arabic letters and basic Latin
        const words = node.textContent.split(/([\s\.,;:\!\?\(\)\[\]\"\'\«\»\—\-]+)/);

        let hasMatches = false;
        const fragments: (string | Node)[] = [];

        for (const w of words) {
          // check lookup
          if (w.trim().length > 2) {
            const def = lugatService.lookup(w, getLocale());
            if (def) {
              hasMatches = true;
              const span = doc.createElement('span');
              span.textContent = w;
              span.className =
                'lugat-highlight cursor-help border-b-2 border-dotted border-primary/50 hover:bg-primary/10 transition-colors';
              span.dataset['word'] = w;
              span.onclick = (e: MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                onWordClick(w, getLocale());
              };
              fragments.push(span);
            } else {
              fragments.push(w);
            }
          } else {
            fragments.push(w);
          }
        }

        if (hasMatches && node.parentNode) {
          const parent = node.parentNode;
          const wrapper = doc.createDocumentFragment();
          for (const f of fragments) {
            if (typeof f === 'string') {
              wrapper.appendChild(doc.createTextNode(f));
            } else {
              wrapper.appendChild(f);
              processedElements.current.add(f as HTMLElement);
            }
          }
          parent.replaceChild(wrapper, node);
        }
      }
    } finally {
      processingRef.current = false;
    }
  };

  const debouncedHighlight = useRef(debounce(highlightWords, 500)).current;

  useEffect(() => {
    if (!view || !activeEnabled) return;

    if ('renderer' in view) {
      view.addEventListener('load', debouncedHighlight);
      view.addEventListener('relocate', debouncedHighlight);
    } else {
      debouncedHighlight();
    }

    // observer for DOM changes
    const doc =
      'renderer' in view && view.renderer ? view.renderer.doc : (view as HTMLElement).ownerDocument;
    if (doc) {
      observerRef.current = new MutationObserver(() => {
        debouncedHighlight();
      });
      observerRef.current.observe(doc.body || view, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    return () => {
      if ('renderer' in view) {
        view.removeEventListener('load', debouncedHighlight);
        view.removeEventListener('relocate', debouncedHighlight);
      }
      observerRef.current?.disconnect();
      processedElements.current.clear();
    };
  }, [view, activeEnabled, bookKey, progress, debouncedHighlight]);
}
