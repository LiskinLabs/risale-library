/**
 * Quran Meal (Translation) Index
 *
 * Data loaded lazily — only the requested language is imported on first use.
 * 10 languages × ~2.5MB each = would block DOM if all loaded eagerly.
 *
 * Languages: tr, en, ru, bn, es, fr, id, sv, ur, zh
 */

interface MealEntry {
  id: string;
  meal: string;
  arabic?: string;
}

export type MealLanguage = 'tr' | 'en' | 'ru' | 'bn' | 'es' | 'fr' | 'id' | 'sv' | 'ur' | 'zh';

const LANG_IMPORTS: Record<MealLanguage, () => Promise<{ default: MealEntry[] }>> = {
  tr: () => import('./meal-data/meal-0.json'),
  en: () => import('./meal-data/meal-en.json'),
  ru: () => import('./meal-data/meal-ru.json'),
  bn: () => import('./meal-data/meal-bn.json'),
  es: () => import('./meal-data/meal-es.json'),
  fr: () => import('./meal-data/meal-fr.json'),
  id: () => import('./meal-data/meal-id.json'),
  sv: () => import('./meal-data/meal-sv.json'),
  ur: () => import('./meal-data/meal-ur.json'),
  zh: () => import('./meal-data/meal-zh.json'),
};

// ── Lazy-loaded caches ───────────────────────────────────────────────

const mealsByLang: Partial<Record<MealLanguage, Map<string, MealEntry>>> = {};
const loadingPromises: Partial<Record<MealLanguage, Promise<Map<string, MealEntry>>>> = {};

async function loadMeals(lang: MealLanguage): Promise<Map<string, MealEntry>> {
  if (mealsByLang[lang]) return mealsByLang[lang]!;
  if (loadingPromises[lang]) return loadingPromises[lang]!;

  const promise = (async () => {
    const mod = await LANG_IMPORTS[lang]();
    const map = new Map<string, MealEntry>();
    for (const e of mod.default) {
      map.set(e.id, e);
    }
    // Turkish: also load full Quran as supplement
    if (lang === 'tr') {
      try {
        const fullQuran = await import('./meal-data/meal-tr.json');
        for (const e of (fullQuran as { default: MealEntry[] }).default) {
          if (!map.has(e.id)) map.set(e.id, e);
        }
      } catch {
        /* optional — Risale-specific is enough */
      }
    }
    mealsByLang[lang] = map;
    return map;
  })();

  loadingPromises[lang] = promise;
  return promise;
}

// ── Public API ──────────────────────────────────────────────────────

function normalizeArabic(text: string): string {
  return text
    .replace(/[ً-ٰٟۖ-ۭ]/g, '')
    .replace(/[ـ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function lookupMeal(
  arabicText: string,
  lang: MealLanguage = 'tr',
): Promise<string | null> {
  const norm = normalizeArabic(arabicText);
  const meals = await loadMeals(lang);

  for (const [, entry] of meals) {
    if (entry.arabic && normalizeArabic(entry.arabic) === norm) {
      return entry.meal;
    }
  }

  for (const [, entry] of meals) {
    if (entry.arabic && normalizeArabic(entry.arabic).includes(norm.substring(0, 30))) {
      return entry.meal;
    }
  }

  // Fallback to Turkish
  if (lang !== 'tr') {
    return lookupMeal(arabicText, 'tr');
  }

  return null;
}

export function getMealLanguage(uiLang: string): MealLanguage {
  const code = (uiLang || 'tr').split('-')[0].toLowerCase();
  const available = new Set<MealLanguage>([
    'tr', 'en', 'ru', 'bn', 'es', 'fr', 'id', 'sv', 'ur', 'zh',
  ]);
  if (available.has(code as MealLanguage)) return code as MealLanguage;
  return 'tr';
}

/**
 * Preload a language's meal data in the background.
 * Call when UI language changes to warm the cache.
 */
export function preloadMeal(lang: MealLanguage): void {
  loadMeals(lang).catch(() => {});
}

/** Synchronous lookup after data is loaded. Falls back to load+lookup. */
export async function getMealById(
  id: string,
  lang: MealLanguage = 'tr',
): Promise<MealEntry | undefined> {
  const meals = await loadMeals(lang);
  return meals.get(id);
}
