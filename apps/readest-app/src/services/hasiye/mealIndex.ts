/**
 * Quran Meal (Translation) Index
 *
 * Data loaded at build time from:
 * - risale_extraction/meal/tr/*.json (Turkish, Risale-specific)
 * - quran-json (English: Saheeh Intl, Russian: Kuliev)
 *
 * Provides lookup of Quran translations for Arabic text fragments
 * that appear in Risale-i Nur books.
 *
 * Supported languages: tr, en, ru
 */

import mealDataTR from './meal-data/meal-0.json';
import mealDataEN from './meal-data/meal-en.json';
import mealDataRU from './meal-data/meal-ru.json';

// ── Types ─────────────────────────────────────────────────────────────

interface MealEntry {
  id: string; // surah:ayah or just ID
  meal: string; // translation text
  arabic?: string;
}

type MealLanguage = 'tr' | 'en' | 'ru';

// ── Build-time meal indexes (one per language) ────────────────────────

const mealsByLang: Record<MealLanguage, Map<string, MealEntry>> = {
  tr: new Map(),
  en: new Map(),
  ru: new Map(),
};

function indexMeals(lang: MealLanguage, entries: MealEntry[]) {
  for (const e of entries) {
    mealsByLang[lang].set(e.id, e);
  }
}

indexMeals('tr', mealDataTR as MealEntry[]);
indexMeals('en', mealDataEN as MealEntry[]);
indexMeals('ru', mealDataRU as MealEntry[]);

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
 * Searches in the specified language's index.
 * Returns null if no match found.
 */
export function lookupMeal(arabicText: string, lang: MealLanguage = 'tr'): string | null {
  const norm = normalizeArabic(arabicText);
  const meals = mealsByLang[lang];

  // Direct lookup by normalized text
  for (const [, entry] of meals) {
    if (entry.arabic && normalizeArabic(entry.arabic) === norm) {
      return entry.meal;
    }
  }

  // Substring match: the book often quotes partial ayahs
  for (const [, entry] of meals) {
    if (entry.arabic && normalizeArabic(entry.arabic).includes(norm.substring(0, 30))) {
      return entry.meal;
    }
  }

  // Fallback to Turkish if not found in requested language
  if (lang !== 'tr') {
    return lookupMeal(arabicText, 'tr');
  }

  return null;
}

/**
 * Get the user's preferred meal language based on UI language.
 */
export function getMealLanguage(uiLang: string): MealLanguage {
  if (uiLang === 'ru' || uiLang === 'ru-RU') return 'ru';
  if (uiLang === 'en' || uiLang === 'en-US') return 'en';
  return 'tr'; // default to Turkish
}

/**
 * Get a meal entry by its numeric ID.
 */
export function getMealById(id: string, lang: MealLanguage = 'tr'): MealEntry | undefined {
  return mealsByLang[lang].get(id);
}

/** Number of loaded meal entries per language */
export const mealCounts: Record<MealLanguage, number> = {
  tr: mealsByLang.tr.size,
  en: mealsByLang.en.size,
  ru: mealsByLang.ru.size,
};
