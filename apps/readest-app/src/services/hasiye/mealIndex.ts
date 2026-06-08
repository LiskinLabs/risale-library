/**
 * Quran Meal (Translation) Index
 *
 * Data sources:
 * - meal-0.json: Risale-specific Turkish translations (4293 verses quoted in Risale)
 * - meal-{lang}.json: Full Quran translations from quran-json (6236 verses each)
 *
 * Languages: tr, en, ru, bn, es, fr, id, sv, ur, zh
 *
 * Lookup is O(n) by Arabic text match. For MVP this is fine —
 * in production this should be a proper SQLite/pgvector index.
 */

import mealDataTR from './meal-data/meal-0.json';
import mealDataEN from './meal-data/meal-en.json';
import mealDataRU from './meal-data/meal-ru.json';
import mealDataBN from './meal-data/meal-bn.json';
import mealDataES from './meal-data/meal-es.json';
import mealDataFR from './meal-data/meal-fr.json';
import mealDataID from './meal-data/meal-id.json';
import mealDataSV from './meal-data/meal-sv.json';
import mealDataTRFull from './meal-data/meal-tr.json';
import mealDataUR from './meal-data/meal-ur.json';
import mealDataZH from './meal-data/meal-zh.json';

// ── Types ─────────────────────────────────────────────────────────────

interface MealEntry {
  id: string;
  meal: string;
  arabic?: string;
}

export type MealLanguage = 'tr' | 'en' | 'ru' | 'bn' | 'es' | 'fr' | 'id' | 'sv' | 'ur' | 'zh';

// ── Build-time meal indexes (one per language) ────────────────────────

const mealsByLang: Record<MealLanguage, Map<string, MealEntry>> = {
  tr: new Map(),
  en: new Map(),
  ru: new Map(),
  bn: new Map(),
  es: new Map(),
  fr: new Map(),
  id: new Map(),
  sv: new Map(),
  ur: new Map(),
  zh: new Map(),
};

function indexMeals(lang: MealLanguage, entries: MealEntry[]) {
  for (const e of entries) {
    mealsByLang[lang].set(e.id, e);
  }
}

// Turkish: Risale-specific first (better translations), then full Quran as fallback
indexMeals('tr', mealDataTR as MealEntry[]);
indexMeals('tr', mealDataTRFull as MealEntry[]);
// All other languages: full Quran
indexMeals('en', mealDataEN as MealEntry[]);
indexMeals('ru', mealDataRU as MealEntry[]);
indexMeals('bn', mealDataBN as MealEntry[]);
indexMeals('es', mealDataES as MealEntry[]);
indexMeals('fr', mealDataFR as MealEntry[]);
indexMeals('id', mealDataID as MealEntry[]);
indexMeals('sv', mealDataSV as MealEntry[]);
indexMeals('ur', mealDataUR as MealEntry[]);
indexMeals('zh', mealDataZH as MealEntry[]);

// ── Public API ──────────────────────────────────────────────────────

function normalizeArabic(text: string): string {
  return text
    .replace(/[ً-ٰٟۖ-ۭ]/g, '')
    .replace(/[ـ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

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

/** Maps UI language code to available meal language */
export function getMealLanguage(uiLang: string): MealLanguage {
  const code = (uiLang || 'tr').split('-')[0].toLowerCase();
  const available = new Set<MealLanguage>([
    'tr', 'en', 'ru', 'bn', 'es', 'fr', 'id', 'sv', 'ur', 'zh',
  ]);
  if (available.has(code as MealLanguage)) return code as MealLanguage;
  return 'tr';
}

export function getMealById(id: string, lang: MealLanguage = 'tr'): MealEntry | undefined {
  return mealsByLang[lang].get(id);
}

export const mealCounts: Record<MealLanguage, number> = {
  tr: mealsByLang.tr.size,
  en: mealsByLang.en.size,
  ru: mealsByLang.ru.size,
  bn: mealsByLang.bn.size,
  es: mealsByLang.es.size,
  fr: mealsByLang.fr.size,
  id: mealsByLang.id.size,
  sv: mealsByLang.sv.size,
  ur: mealsByLang.ur.size,
  zh: mealsByLang.zh.size,
};
