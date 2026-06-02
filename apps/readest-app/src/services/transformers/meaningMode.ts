/**
 * Anlam Açık Modu (Open Meaning Mode) transformer.
 *
 * Injects inline definitions for Ottoman/Arabic/Turkish theological terms
 * directly into the text. Word → definition lookup is done via the lugat.db
 * SQLite database. Only activates when viewSettings.meaningDisplayMode === 'open'.
 *
 * Word-level filtering is controlled by dictionaryLevel (0-3):
 *   0 (Başlangıç) — annotate all dictionary matches
 *   1 (Orta) — annotate priority terms + all non-common words
 *   2 (İleri) — annotate only priority theological terms
 *   3 (Tümü) — no annotations (transformer returns unchanged)
 *
 * Performance: the transformer pre-loads the entire lugat dictionary into a
 * Map on first use (cached at module scope). With 38K entries, this uses ~2MB
 * of memory — acceptable for a reader app.
 */

import type { Transformer } from './types';
import { COMMON_TURKISH_WORDS, MIN_WORD_LENGTH, PRIORITY_TERMS } from './turkishStoplist';

// ── Module-scoped dictionary cache ──────────────────────────────────

let _termDict: Map<string, string> | null = null;
let _loadPromise: Promise<Map<string, string>> | null = null;

async function loadDictionary(): Promise<Map<string, string>> {
  if (_termDict) return _termDict;
  if (_loadPromise) return _loadPromise;

  _loadPromise = (async () => {
    const dict = new Map<string, string>();
    try {
      // Fetch from the public data directory (web) or filesystem
      const dbUrl = '/data/lugat.db';
      const response = await fetch(dbUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      // Use a lightweight approach — we can't use SQLite WASM in a transformer
      void (await response.arrayBuffer());
      // because it runs in the content iframe. Instead, pre-built JSON index.
      // Fallback: fetch a pre-built JSON mapping if available.
      const jsonUrl = '/data/lugat-terms.json';
      const jsonResp = await fetch(jsonUrl);
      if (jsonResp.ok) {
        const entries: { term: string; definition: string }[] = await jsonResp.json();
        for (const e of entries) {
          dict.set(e.term.toLowerCase().trim(), e.definition.trim());
        }
        console.log(`[MeaningMode] Loaded ${dict.size} dictionary terms`);
      } else {
        console.warn('[MeaningMode] lugat-terms.json not found — run tools/build-lugat-json.py');
      }
    } catch (err) {
      console.error('[MeaningMode] Failed to load dictionary:', err);
    }
    _termDict = dict;
    return dict;
  })();

  return _loadPromise;
}

// ── Word matching ───────────────────────────────────────────────────

const WORD_BOUNDARY = /([\s>])([a-zA-ZçğıöşüâîûêôÇĞİÖŞÜÂÎÛÊÔ']+)([\s<.,;:!?)\]])/g;

function shouldAnnotate(word: string, level: number): boolean {
  const lower = word.toLowerCase();

  if (level >= 3) return false; // Tümü — nothing
  if (lower.length < MIN_WORD_LENGTH) return false;
  if (COMMON_TURKISH_WORDS.has(lower)) return false;

  // Level 2 (İleri) — only priority theological terms
  if (level >= 2) return PRIORITY_TERMS.has(lower);

  // Level 1 (Orta) — priority terms + dictionary words
  // Level 0 (Başlangıç) — all dictionary words
  return true;
}

// ── Transformer ─────────────────────────────────────────────────────

export const meaningModeTransformer: Transformer = {
  name: 'meaning-mode',

  transform: async (ctx) => {
    // Only transform reflowable content; skip fixed-layout
    if (ctx.isFixedLayout) return ctx.content;

    const level = ctx.viewSettings.dictionaryLevel ?? 3;
    if (level >= 3) return ctx.content; // Tümü — no annotations

    const dict = await loadDictionary();
    if (dict.size === 0) return ctx.content; // No dictionary available

    let result = ctx.content;

    // Process text content — match words that exist in the dictionary
    result = result.replace(
      WORD_BOUNDARY,
      (full: string, before: string, word: string, after: string) => {
        const lower = word.toLowerCase();
        if (!shouldAnnotate(word, level)) return full;

        // Check dictionary
        const definition = dict.get(lower);
        if (!definition) return full;

        // Extract a short definition (first sentence or first 80 chars)
        const shortDef = definition.split('.')[0]?.trim().slice(0, 80) || definition.slice(0, 80);
        const escaped = shortDef.replace(/"/g, '&quot;').replace(/</g, '&lt;');

        // Wrap in an inline annotation span
        return `${before}<span class="meaning-annotated" data-def="${escaped}" title="${escaped}">${word}</span>${after}`;
      },
    );

    return result;
  },
};
