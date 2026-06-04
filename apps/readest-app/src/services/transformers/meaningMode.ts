/**
 * Anlam Açık Modu (Open Meaning Mode) transformer.
 *
 * Injects inline definitions for Ottoman/Arabic/Turkish theological terms
 * directly into the text. Word → definition lookup uses binary search over
 * a sorted term array (SQLite ORDER BY term), with optional IndexedDB caching
 * to skip the 4.6 MB JSON download on subsequent page loads.
 *
 * Word-level filtering is controlled by dictionaryLevel (0-3):
 *   0 (Başlangıç) — annotate all dictionary matches
 *   1 (Orta) — annotate priority terms + all non-common words
 *   2 (İleri) — annotate only priority theological terms
 *   3 (Tümü) — no annotations (transformer returns unchanged)
 *
 * Memory: ~8 MB for the sorted array (vs ~15-20 MB for Map<string,string>).
 * Lookup: O(log n) binary search — ~16 comparisons for 38K entries.
 */

import type { Transformer } from './types';
import { COMMON_TURKISH_WORDS, MIN_WORD_LENGTH, PRIORITY_TERMS } from './turkishStoplist';

// ── Types ───────────────────────────────────────────────────────────

interface TermEntry {
  term: string; // lowercased, trimmed
  definition: string;
}

// ── Module-scoped dictionary cache ──────────────────────────────────

let _entries: TermEntry[] | null = null;
let _loadPromise: Promise<TermEntry[]> | null = null;

/** Binary search over sorted term array. Returns definition or undefined. */
function binaryLookup(entries: TermEntry[], target: string): string | undefined {
  let lo = 0;
  let hi = entries.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    const entry = entries[mid]!;
    // SQLite ORDER BY uses BINARY collation, so < and > give correct ordering
    if (target < entry.term) {
      hi = mid - 1;
    } else if (target > entry.term) {
      lo = mid + 1;
    } else {
      return entry.definition;
    }
  }
  return undefined;
}

// ── IndexedDB helpers ───────────────────────────────────────────────

const IDB_NAME = 'risale-meaning-cache';
const IDB_STORE = 'terms';
const IDB_VERSION = 1;

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(IDB_STORE, { keyPath: 'term' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function loadFromIndexedDB(): Promise<TermEntry[]> {
  try {
    const db = await openIdb();
    const tx = db.transaction(IDB_STORE, 'readonly');
    const store = tx.objectStore(IDB_STORE);
    const countReq = store.count();
    const count = await new Promise<number>((resolve, reject) => {
      countReq.onsuccess = () => resolve(countReq.result);
      countReq.onerror = () => reject(countReq.error);
    });
    if (count === 0) return [];
    // Load all entries — they're stored in insertion order (which is sorted)
    const getAllReq = store.getAll();
    const entries = await new Promise<TermEntry[]>((resolve, reject) => {
      getAllReq.onsuccess = () => resolve(getAllReq.result as TermEntry[]);
      getAllReq.onerror = () => reject(getAllReq.error);
    });
    db.close();
    return entries;
  } catch {
    return [];
  }
}

async function saveToIndexedDB(entries: TermEntry[]): Promise<void> {
  try {
    const db = await openIdb();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    // Clear old data first
    store.clear();
    // Write in batches to avoid transaction timeouts
    const BATCH = 5000;
    for (let i = 0; i < entries.length; i += BATCH) {
      const batch = entries.slice(i, i + BATCH);
      for (const entry of batch) {
        store.put(entry);
      }
      // Yield between batches
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
    db.close();
    console.log(`[MeaningMode] Cached ${entries.length} terms in IndexedDB`);
  } catch (err) {
    console.warn('[MeaningMode] IndexedDB cache failed:', err);
  }
}

async function loadDictionary(): Promise<TermEntry[]> {
  if (_entries) return _entries;
  if (_loadPromise) return _loadPromise;

  _loadPromise = (async () => {
    // 1. Try IndexedDB cache (avoids 4.6 MB network fetch)
    let entries = await loadFromIndexedDB();

    // 2. Fallback: fetch JSON and cache it for next time
    if (!entries || entries.length === 0) {
      const jsonUrl = '/data/lugat-terms.json';
      const jsonResp = await fetch(jsonUrl);
      if (jsonResp.ok) {
        const raw: { term: string; definition: string }[] = await jsonResp.json();
        entries = raw.map((e) => ({
          term: e.term.toLowerCase().trim(),
          definition: e.definition.trim(),
        }));
        console.log(`[MeaningMode] Loaded ${entries.length} dictionary terms from JSON`);
        // Cache in background (don't block first paint)
        saveToIndexedDB(entries).catch(() => {});
      } else {
        console.warn('[MeaningMode] lugat-terms.json not found — run tools/build-lugat-json.py');
        entries = [];
      }
    } else {
      console.log(`[MeaningMode] Loaded ${entries.length} dictionary terms from IndexedDB cache`);
    }

    _entries = entries;
    return entries;
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

    // Respect layer toggle
    const enabledLayers = ctx.viewSettings.enabledLayers || ['user', 'author', 'hasiye', 'lugat'];
    if (!enabledLayers.includes('lugat')) return ctx.content;

    const level = ctx.viewSettings.dictionaryLevel ?? 3;
    if (level >= 3) return ctx.content; // Tümü — no annotations

    const entries = await loadDictionary();
    if (entries.length === 0) return ctx.content; // No dictionary available

    let result = ctx.content;

    // Process text content — binary search over sorted term array
    result = result.replace(
      WORD_BOUNDARY,
      (full: string, before: string, word: string, after: string) => {
        const lower = word.toLowerCase();
        if (!shouldAnnotate(word, level)) return full;

        // Binary search O(log n) lookup
        const definition = binaryLookup(entries, lower);
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
