/**
 * Quran Meal (Translation) Index
 *
 * Data loaded lazily — 10 languages × ~2.5MB each.
 * Returns meal + surah:ayah reference on match.
 */

interface MealEntry {
  id: string;
  meal: string;
  arabic?: string;
}

export interface MealResult {
  meal: string;
  /** Surah name + ayah number, e.g. "Al-Baqarah 2:255" */
  reference: string;
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

const mealsByLang: Partial<Record<MealLanguage, Map<string, MealEntry>>> = {};
const loadingPromises: Partial<Record<MealLanguage, Promise<Map<string, MealEntry>>>> = {};

async function loadMeals(lang: MealLanguage): Promise<Map<string, MealEntry>> {
  if (mealsByLang[lang]) return mealsByLang[lang]!;
  if (loadingPromises[lang]) return loadingPromises[lang]!;

  const promise = (async () => {
    const mod = await LANG_IMPORTS[lang]();
    const map = new Map<string, MealEntry>();
    for (const e of mod.default) {
      if (!map.has(e.id)) map.set(e.id, e);
    }
    // Turkish: also load full Quran as supplement
    if (lang === 'tr') {
      try {
        const fullQuran = await import('./meal-data/meal-tr.json');
        for (const e of (fullQuran as { default: MealEntry[] }).default) {
          if (!map.has(e.id)) map.set(e.id, e);
        }
      } catch { /* optional */ }
    }
    mealsByLang[lang] = map;
    return map;
  })();

  loadingPromises[lang] = promise;
  return promise;
}

// ── Surah names ─────────────────────────────────────────────────────

const SURAH_NAMES: Record<number, string> = {
  1: 'Al-Fatihah', 2: 'Al-Baqarah', 3: 'Aal-E-Imran', 4: 'An-Nisa',
  5: 'Al-Ma\'idah', 6: 'Al-An\'am', 7: 'Al-A\'raf', 8: 'Al-Anfal',
  9: 'At-Tawbah', 10: 'Yunus', 11: 'Hud', 12: 'Yusuf', 13: 'Ar-Ra\'d',
  14: 'Ibrahim', 15: 'Al-Hijr', 16: 'An-Nahl', 17: 'Al-Isra', 18: 'Al-Kahf',
  19: 'Maryam', 20: 'Ta-Ha', 21: 'Al-Anbiya', 22: 'Al-Hajj', 23: 'Al-Mu\'minun',
  24: 'An-Nur', 25: 'Al-Furqan', 26: 'Ash-Shu\'ara', 27: 'An-Naml',
  28: 'Al-Qasas', 29: 'Al-Ankabut', 30: 'Ar-Rum', 31: 'Luqman',
  32: 'As-Sajdah', 33: 'Al-Ahzab', 34: 'Saba', 35: 'Fatir', 36: 'Ya-Sin',
  37: 'As-Saffat', 38: 'Sad', 39: 'Az-Zumar', 40: 'Ghafir', 41: 'Fussilat',
  42: 'Ash-Shura', 43: 'Az-Zukhruf', 44: 'Ad-Dukhan', 45: 'Al-Jathiyah',
  46: 'Al-Ahqaf', 47: 'Muhammad', 48: 'Al-Fath', 49: 'Al-Hujurat',
  50: 'Qaf', 51: 'Adh-Dhariyat', 52: 'At-Tur', 53: 'An-Najm',
  54: 'Al-Qamar', 55: 'Ar-Rahman', 56: 'Al-Waqi\'ah', 57: 'Al-Hadid',
  58: 'Al-Mujadilah', 59: 'Al-Hashr', 60: 'Al-Mumtahanah', 61: 'As-Saff',
  62: 'Al-Jumu\'ah', 63: 'Al-Munafiqun', 64: 'At-Taghabun', 65: 'At-Talaq',
  66: 'At-Tahrim', 67: 'Al-Mulk', 68: 'Al-Qalam', 69: 'Al-Haqqah',
  70: 'Al-Ma\'arij', 71: 'Nuh', 72: 'Al-Jinn', 73: 'Al-Muzzammil',
  74: 'Al-Muddaththir', 75: 'Al-Qiyamah', 76: 'Al-Insan', 77: 'Al-Mursalat',
  78: 'An-Naba', 79: 'An-Nazi\'at', 80: 'Abasa', 81: 'At-Takwir',
  82: 'Al-Infitar', 83: 'Al-Mutaffifin', 84: 'Al-Inshiqaq', 85: 'Al-Buruj',
  86: 'At-Tariq', 87: 'Al-A\'la', 88: 'Al-Ghashiyah', 89: 'Al-Fajr',
  90: 'Al-Balad', 91: 'Ash-Shams', 92: 'Al-Layl', 93: 'Ad-Duha',
  94: 'Ash-Sharh', 95: 'At-Tin', 96: 'Al-Alaq', 97: 'Al-Qadr',
  98: 'Al-Bayyinah', 99: 'Az-Zalzalah', 100: 'Al-Adiyat', 101: 'Al-Qari\'ah',
  102: 'At-Takathur', 103: 'Al-Asr', 104: 'Al-Humazah', 105: 'Al-Fil',
  106: 'Quraysh', 107: 'Al-Ma\'un', 108: 'Al-Kawthar', 109: 'Al-Kafirun',
  110: 'An-Nasr', 111: 'Al-Masad', 112: 'Al-Ikhlas', 113: 'Al-Falaq',
  114: 'An-Nas',
};

function parseReference(id: string): string {
  // quran-json format: "surah:ayah"
  const parts = id.split(':');
  if (parts.length === 2 && parts[0] && parts[1]) {
    const surah = parseInt(parts[0], 10);
    const ayah = parts[1];
    const name = SURAH_NAMES[surah];
    return name ? `${name} ${surah}:${ayah}` : `Surah ${surah}, Ayah ${ayah}`;
  }
  // Risale-specific: just numeric ID — return as-is
  return `#${id}`;
}

// ── Public API ──────────────────────────────────────────────────────

function normalizeArabic(text: string): string {
  return text
    // Remove diacritics (fatḥa, kasra, ḍamma, tanwīn, šadda, sukūn, etc.)
    .replace(/[ً-ٰٟۖ-ۭ۪-ۭ]/g, '')
    // Replace dagger alef (ٱ ٱ) and superscript alef with plain alef
    .replace(/[ٱإأآ]/g, 'ا') // dagger/superscript/hamza alef → plain alef
    // Replace alif wasla
    .replace(/ٱ/g, 'ا')
    // Remove tatweel (kashida)
    .replace(/[ـ]/g, '')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/** Heavy normalize: strip ALL marks, only keep bare Arabic letters. */
function stripAllMarks(text: string): string {
  return text
    .replace(/[^؀-ۿ ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function lookupMeal(
  arabicText: string,
  lang: MealLanguage = 'tr',
): Promise<MealResult | null> {
  const norm = normalizeArabic(arabicText);
  const meals = await loadMeals(lang);

  // Exact match first
  for (const [, entry] of meals) {
    if (entry.arabic && normalizeArabic(entry.arabic) === norm) {
      return { meal: entry.meal, reference: parseReference(entry.id) };
    }
  }

  // Substring match (standard normalize)
  for (const [, entry] of meals) {
    if (entry.arabic && normalizeArabic(entry.arabic).includes(norm.substring(0, 30))) {
      return { meal: entry.meal, reference: parseReference(entry.id) };
    }
  }

  // Heavy normalize: strip ALL marks, compare bare consonants
  const bare = stripAllMarks(arabicText);
  if (bare.length >= 4) {
    for (const [, entry] of meals) {
      if (entry.arabic && stripAllMarks(entry.arabic).includes(bare.substring(0, 20))) {
        return { meal: entry.meal, reference: parseReference(entry.id) };
      }
    }
  }

  // Fallback to Turkish if requested lang wasn't found
  if (lang !== 'tr') {
    return lookupMeal(arabicText, 'tr');
  }

  return null;
}

export function getMealLanguage(uiLang: string): MealLanguage {
  const code = ((uiLang || 'tr').split('-')[0] || 'tr').toLowerCase();
  const available = new Set<MealLanguage>([
    'tr', 'en', 'ru', 'bn', 'es', 'fr', 'id', 'sv', 'ur', 'zh',
  ]);
  if (available.has(code as MealLanguage)) return code as MealLanguage;
  return 'tr';
}

export function preloadMeal(lang: MealLanguage): void {
  loadMeals(lang).catch(() => {});
}

export async function getMealById(
  id: string,
  lang: MealLanguage = 'tr',
): Promise<MealEntry | undefined> {
  const meals = await loadMeals(lang);
  return meals.get(id);
}
