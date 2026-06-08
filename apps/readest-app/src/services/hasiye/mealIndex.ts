/**
 * Quran Meal (Translation) Index
 *
 * Data loaded at build time from risale_extraction/meal/tr/*.json.
 * Provides O(1) lookup of Turkish meal translations for Quranic Arabic
 * text fragments that appear in Risale-i Nur books.
 *
 * In production this should be a proper SQLite/pgvector index;
 * for MVP we use an in-memory Map keyed by a simple Arabic fingerprint.
 */

import mealData0 from './meal-data/meal-0.json';

// ── Build-time meal index ───────────────────────────────────────────

interface MealEntry {
  id: string; // surah:ayah or just ID
  meal: string; // Turkish translation text
  arabic?: string;
}

/** All meal entries indexed by their numeric ID for fast lookup. */
const mealById = new Map<string, MealEntry>();

function indexMeals(entries: MealEntry[]) {
  for (const e of entries) {
    mealById.set(e.id, e);
  }
}

indexMeals(mealData0 as MealEntry[]);

// ── Public API ──────────────────────────────────────────────────────

/**
 * Normalize Arabic text for comparison: remove diacritics and tatweel,
 * collapse whitespace.
 */
function normalizeArabic(text: string): string {
  return text
    .replace(/[ً-ٰٟۖ-ۭ]/g, '') // Arabic diacritics
    .replace(/[ـ]/g, '') // tatweel (kashida)
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Try to find a meal translation for the given Arabic text.
 * Returns null if no match found.
 */
export function lookupMeal(arabicText: string): string | null {
  const norm = normalizeArabic(arabicText);

  // Direct lookup by normalized text
  for (const [, entry] of mealById) {
    if (entry.arabic && normalizeArabic(entry.arabic) === norm) {
      return entry.meal;
    }
  }

  // Substring match: the book often quotes partial ayahs
  for (const [, entry] of mealById) {
    if (entry.arabic && normalizeArabic(entry.arabic).includes(norm.substring(0, 30))) {
      return entry.meal;
    }
  }

  return null;
}

/**
 * Get a meal entry by its numeric ID.
 */
export function getMealById(id: string): MealEntry | undefined {
  return mealById.get(id);
}

/** Number of loaded meal entries */
export const mealCount = mealById.size;
