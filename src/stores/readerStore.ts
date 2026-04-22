import { atom } from 'nanostores';
import { persistentAtom, persistentMap } from '@nanostores/persistent';

// ═══ Reading Settings (Persistent) ═══

export const readerTheme = persistentAtom<string>('reader_theme', 'white');
export const readerFont = persistentAtom<string>('reader_font', 'kazimir');
export const fontScale = persistentAtom<number>('font_scale', 1, {
  encode: (v) => v.toString(),
  decode: (v) => parseFloat(v) || 1
});
export const readerMargins = persistentAtom<string>('reader_margins', 'normal');
export const readerLineHeight = persistentAtom<string>('reader_line_height', 'normal');
export const readerHyphens = persistentAtom<boolean>('reader_hyphens', true, {
  encode: JSON.stringify,
  decode: JSON.parse
});
export const readerView = persistentAtom<string>('reader_view', 'scroll'); // 'scroll' | 'book'
export const readerAnimations = persistentAtom<boolean>('reader_animations', true, {
  encode: JSON.stringify,
  decode: JSON.parse
});
export const isCommentaryVisible = persistentAtom<boolean>('commentary_visible', true, {
  encode: JSON.stringify,
  decode: JSON.parse
});

// ═══ Reading Progress ═══

export const lastReadBook = persistentAtom<string | undefined>('last_read_book', undefined);
export const readingProgress = persistentMap<Record<string, string>>('reading_progress', {});

// ═══ Bookmarks ═══

export interface Bookmark {
  slug: string;
  title: string;
  hash?: string;
  date: number;
}

export const bookmarks = persistentAtom<Bookmark[]>('bookmarks', [], {
  encode: JSON.stringify,
  decode: JSON.parse
});

// ═══ Dictionary / Lugat ═══

export interface LugatEntry {
  word: string;
  meaning: string;
}
export const selectedWord = atom<LugatEntry | null>(null);

// ═══ UI State ═══

export const isSettingsPanelOpen = atom<boolean>(false);
export const isTocModalOpen = atom<boolean>(false);
export const scrollProgress = atom<number>(0);

// ═══ Apply settings to DOM ═══

export function applyReaderSettings() {
  const root = document.documentElement;
  root.setAttribute('data-theme', readerTheme.get());
  root.setAttribute('data-font', readerFont.get());
  root.setAttribute('data-margins', readerMargins.get());
  root.setAttribute('data-line-height', readerLineHeight.get());
  root.setAttribute('data-hyphens', readerHyphens.get() ? 'on' : 'off');
  root.setAttribute('data-view', readerView.get());
  root.setAttribute('data-animations', readerAnimations.get() ? 'on' : 'off');
  
  // Apply font scale as CSS var
  const scale = fontScale.get();
  const basePx = 18 * scale;
  root.style.setProperty('--reader-font-size', `${basePx}px`);
}
