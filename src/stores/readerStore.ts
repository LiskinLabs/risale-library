import { atom } from 'nanostores';
import { persistentAtom, persistentMap } from '@nanostores/persistent';

// ═══ Reading Settings (Persistent) ═══

export const readerTheme = persistentAtom<string>('reader_theme', 'white');
export const readerFont = persistentAtom<string>('reader_font', 'literata');
export const fontScale = persistentAtom<number>('font_scale', 1, {
  encode: (v) => v.toString(),
  decode: (v) => {
    const parsed = parseFloat(v);
    return isNaN(parsed) ? 1 : Number(parsed);
  }
});
export const readerMargins = persistentAtom<string>('reader_margins', 'normal');
export const readerLineHeight = persistentAtom<string>('reader_line_height', 'normal');
export const readerAlignment = persistentAtom<string>('reader_alignment', 'left');
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

// ═══ Book Language (Session) ═══

export const bookLanguage = atom<string>('ru');

// ═══ Per-Language Font System ═══

export type ScriptGroup = 'cyrillic' | 'latin-turkish' | 'latin-european' | 'arabic' | 'persian' | 'urdu';

export interface FontOption {
  value: string;
  label: string;
  family: string;
}

const SCRIPT_GROUPS: Record<string, ScriptGroup> = {
  ru: 'cyrillic',
  kz: 'cyrillic',
  uz: 'cyrillic',
  tr: 'latin-turkish',
  os: 'latin-turkish',
  de: 'latin-european',
  en: 'latin-european',
  es: 'latin-european',
  ar: 'arabic',
  fa: 'persian',
  ur: 'urdu',
};

const FONTS_BY_SCRIPT: Record<ScriptGroup, FontOption[]> = {
  cyrillic: [
    { value: 'literata', label: 'Literata', family: "'Literata', serif" },
    { value: 'lora', label: 'Lora', family: "'Lora', serif" },
    { value: 'pt-serif', label: 'PT Serif', family: "'PT Serif', serif" },
    { value: 'sans', label: 'Sans', family: "'Inter', sans-serif" },
  ],
  'latin-turkish': [
    { value: 'literata', label: 'Literata', family: "'Literata', serif" },
    { value: 'lora', label: 'Lora', family: "'Lora', serif" },
    { value: 'pt-serif', label: 'PT Serif', family: "'PT Serif', serif" },
    { value: 'sans', label: 'Sans', family: "'Inter', sans-serif" },
  ],
  'latin-european': [
    { value: 'literata', label: 'Literata', family: "'Literata', serif" },
    { value: 'lora', label: 'Lora', family: "'Lora', serif" },
    { value: 'pt-serif', label: 'PT Serif', family: "'PT Serif', serif" },
    { value: 'sans', label: 'Sans', family: "'Inter', sans-serif" },
  ],
  arabic: [
    { value: 'amiri', label: 'Amiri', family: "'Amiri', serif" },
    { value: 'noto-naskh', label: 'Noto Naskh', family: "'Noto Naskh Arabic', serif" },
    { value: 'scheherazade', label: 'Scheherazade', family: "'Scheherazade New', serif" },
  ],
  persian: [
    { value: 'amiri', label: 'Amiri', family: "'Amiri', serif" },
    { value: 'noto-naskh', label: 'Noto Naskh', family: "'Noto Naskh Arabic', serif" },
    { value: 'scheherazade', label: 'Scheherazade', family: "'Scheherazade New', serif" },
  ],
  urdu: [
    { value: 'noto-nastaliq', label: 'Nastaliq', family: "'Noto Nastaliq Urdu', serif" },
    { value: 'amiri', label: 'Amiri', family: "'Amiri', serif" },
    { value: 'noto-naskh', label: 'Noto Naskh', family: "'Noto Naskh Arabic', serif" },
  ],
};

const DEFAULT_FONT_BY_SCRIPT: Record<ScriptGroup, string> = {
  cyrillic: 'literata',
  'latin-turkish': 'literata',
  'latin-european': 'literata',
  arabic: 'amiri',
  persian: 'amiri',
  urdu: 'noto-nastaliq',
};

export function getScriptGroup(lang: string): ScriptGroup {
  return SCRIPT_GROUPS[lang] || 'latin-european';
}

export function getAvailableFonts(lang: string): FontOption[] {
  return FONTS_BY_SCRIPT[getScriptGroup(lang)] || FONTS_BY_SCRIPT['latin-european'];
}

export function getDefaultFont(lang: string): string {
  return DEFAULT_FONT_BY_SCRIPT[getScriptGroup(lang)] || 'literata';
}

export function getEffectiveFont(lang: string): string {
  const current = readerFont.get();
  const available = getAvailableFonts(lang);
  // If current font is compatible with this language, use it
  if (available.some(f => f.value === current)) return current;
  // Otherwise fall back to default for this language
  return getDefaultFont(lang);
}

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
export const lugatPopupPosition = atom<{ x: number, y: number } | null>(null);

// ═══ UI State ═══

export const isSettingsPanelOpen = atom<boolean>(false);
export const isLeftSidebarOpen = atom<boolean>(false);
export const isRightSidebarOpen = atom<boolean>(false);
export const isTocModalOpen = atom<boolean>(false); // Keeping for legacy/compatibility if needed temporarily
export const scrollProgress = atom<number>(0);

// ═══ Apply settings to DOM ═══

export function applyReaderSettings() {
  const root = document.documentElement;
  const lang = bookLanguage.get();
  const effectiveFont = getEffectiveFont(lang);

  root.setAttribute('data-theme', readerTheme.get());
  root.setAttribute('data-font', effectiveFont);
  root.setAttribute('data-margins', readerMargins.get());
  root.setAttribute('data-line-height', readerLineHeight.get());
  root.setAttribute('data-alignment', readerAlignment.get());
  root.setAttribute('data-hyphens', readerHyphens.get() ? 'on' : 'off');
  root.setAttribute('data-view', readerView.get());
  root.setAttribute('data-animations', readerAnimations.get() ? 'on' : 'off');
  root.setAttribute('data-book-lang', lang);
  
  // Apply font scale as CSS var
  const scale = Number(fontScale.get());
  const basePx = 18 * scale;
  root.style.setProperty('--reader-font-size', `${basePx}px`);
}
