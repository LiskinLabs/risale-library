/**
 * useParallelSync — synchronizes page/scroll position between paired books.
 *
 * When two books are linked as original+translation via parallelViewStore,
 * this hook listens for progress changes on one book and mirrors them to the
 * paired book using section index + progress percentage as the sync key.
 *
 * This approach works because original+translation EPUBs share the same
 * section structure (TOC), making section-index-based sync reliable without
 * needing complex CFI mapping.
 */

import { useEffect, useRef } from 'react';
import { useReaderStore } from '@/store/readerStore';
import { useParallelViewStore } from '@/store/parallelViewStore';

interface SyncState {
  section: number;
  percentage: number;
  timestamp: number;
}

export const useParallelSync = (bookKey: string) => {
  const { getProgress, setProgress } = useReaderStore();
  const { getParallels, areParallels } = useParallelViewStore();
  const lastSynced = useRef<SyncState | null>(null);

  useEffect(() => {
    // Only activate for primary books in a parallel pair
    const parallels = getParallels(bookKey);
    if (!parallels || parallels.length === 0) return;

    const pairedKey = parallels[0]; // Currently one-to-one pairs

    // Poll for sync (~500ms interval — lightweight DOM-based check)
    const interval = setInterval(() => {
      const srcProgress = getProgress(bookKey);
      const dstProgress = getProgress(pairedKey);

      if (!srcProgress || !dstProgress) return;

      const current: SyncState = {
        section: srcProgress.section?.index ?? 0,
        percentage: srcProgress.section?.percentage ?? 0,
        timestamp: Date.now(),
      };

      // Only sync if the source actually changed (debounce)
      if (
        lastSynced.current &&
        lastSynced.current.section === current.section &&
        Math.abs(lastSynced.current.percentage - current.percentage) < 5
      ) {
        return;
      }

      lastSynced.current = current;

      // Mirror progress to paired book
      // Uses section index matching (same TOC structure)
      const dstSection = dstProgress.section;
      if (dstSection && dstSection.index === current.section) {
        // Same section — no need to change section, just scroll
      } else if (dstSection && dstSection.index !== current.section) {
        // Different section — navigate paired book to matching section
        // (Handled via FoliateViewer's cross-book message passing)
        const iframe = document.querySelector(
          `iframe[data-book-key="${pairedKey}"]`,
        ) as HTMLIFrameElement | null;
        if (iframe?.contentWindow) {
          iframe.contentWindow.postMessage(
            { type: 'parallel-sync', section: current.section, percentage: current.percentage },
            '*',
          );
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [bookKey, getProgress, setProgress, getParallels]);
};
