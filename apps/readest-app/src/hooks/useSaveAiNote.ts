/**
 * useSaveAiNote — saves AI dictionary responses as BookNotes.
 *
 * Listens for the 'risale:save-ai-note' CustomEvent dispatched by the
 * AI dictionary provider when the user clicks "Save to Notes".
 * Creates a BookNote with the full formatted HTML content preserved.
 */

import { useEffect } from 'react';
import { useBookDataStore } from '@/store/bookDataStore';
import { useReaderStore } from '@/store/readerStore';
import type { BookNote } from '@/types/book';

interface SaveAiNoteDetail {
  word: string;
  html: string;
  timestamp: number;
}

export function useSaveAiNote(bookKey: string) {
  const { getBookData, updateBooknotes } = useBookDataStore();
  const { getProgress } = useReaderStore();

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<SaveAiNoteDetail>).detail;
      if (!detail?.html) return;

      const bookData = getBookData(bookKey);
      if (!bookData) return;

      const progress = getProgress(bookKey);
      const cfi = progress?.location ?? '';

      const noteHtml = `${detail.html}
<hr style="margin-top:12px;opacity:0.3;"/>
<div style="font-size:10px;opacity:0.5;margin-top:4px;">
  Risale AI Sözlük · ${new Date(detail.timestamp).toLocaleString()}
</div>`;

      const note: BookNote = {
        id: `ai-note-${Date.now()}`,
        type: 'annotation',
        cfi,
        text: `🤖 AI: ${detail.word.slice(0, 80)}`,
        note: noteHtml,
        createdAt: detail.timestamp,
        updatedAt: Date.now(),
        layer: 'user',
        protected: false,
      };

      const existing = bookData.config?.booknotes || [];
      const updated = [...existing, note];
      updateBooknotes(bookKey, updated);
    };

    window.addEventListener('risale:save-ai-note', handler);
    return () => window.removeEventListener('risale:save-ai-note', handler);
  }, [bookKey, getBookData, getProgress, updateBooknotes]);
}
