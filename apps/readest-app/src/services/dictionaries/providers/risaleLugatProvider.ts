import type { DictionaryProvider } from '../types';
import { BUILTIN_PROVIDER_IDS } from '../types';
import { stubTranslation as _ } from '@/utils/misc';
import { AppService } from '@/types/system';
import { DatabaseService } from '@/types/database';

interface LugatEntry extends Record<string, string | null> {
  term: string;
  arabic: string | null;
  definition: string;
}

// ── Turkish normalization ───────────────────────────────────────────

/**
 * Common Turkish inflectional/derivational suffixes.
 * Each suffix may have vowel-harmony variants (e/a, ı/i/u/ü).
 *
 * Ordered from longest → shortest to avoid partial stripping.
 */
const TR_SUFFIXES = [
  // Possessive + case combos
  'larındaki',
  'lerindeki',
  'larından',
  'lerinden',
  'larında',
  'lerinde',
  'larına',
  'lerine',
  'larıyla',
  'leriyle',
  // Plural + possessive
  'larımız',
  'lerimiz',
  'larınız',
  'leriniz',
  'larının',
  'lerinin',
  'larıma',
  'lerime',
  // Plural
  'lardan',
  'lerden',
  'larda',
  'lerde',
  'ları',
  'leri',
  'lar',
  'ler',
  // Verbal nouns (mastar)
  'maktan',
  'mekten',
  'makta',
  'mekte',
  'masına',
  'mesine',
  'masını',
  'mesini',
  'ması',
  'mesi',
  // Participles / gerunds
  'dıktan',
  'dikten',
  'duktan',
  'dükten',
  'dığında',
  'diğinde',
  'duğunda',
  'düğünde',
  'dığını',
  'diğini',
  'duğunu',
  'düğünü',
  'dığı',
  'diği',
  'duğu',
  'düğü',
  // Possessive
  'ımız',
  'imiz',
  'umuz',
  'ümüz',
  'ınız',
  'iniz',
  'unuz',
  'ünüz',
  'ının',
  'inin',
  'unun',
  'ünün',
  'ına',
  'ine',
  'una',
  'üne',
  'ım',
  'im',
  'um',
  'üm',
  'ın',
  'in',
  'un',
  'ün',
  'ı',
  'i',
  'u',
  'ü',
  'sı',
  'si',
  'su',
  'sü',
  // Case suffixes
  'ndan',
  'nden',
  'ndan',
  'nden',
  'nda',
  'nde',
  'nda',
  'nde',
  'dan',
  'den',
  'tan',
  'ten',
  'da',
  'de',
  'ta',
  'te',
  // Dative: -(y)a, -(y)e
  'ya',
  'ye',
  // Ablative/instrumental
  'yla',
  'yle',
  'la',
  'le',
  // Other
  'ken',
  'ki',
  'ce',
  'ca',
  'çe',
  'ça',
  'dir',
  'dır',
  'dur',
  'dür',
  'tir',
  'tır',
  // Compound markers
  'lık',
  'lik',
  'luk',
  'lük',
  'sız',
  'siz',
  'suz',
  'süz',
  'cık',
  'cik',
  'cuk',
  'cük',
];

/**
 * Strip known Turkish suffixes from a word to find the root.
 * Returns candidates sorted from most → least aggressive removal.
 *
 * Handles consonant mutation (k→ğ, p→b, ç→c, t→d) at the new stem boundary.
 */
function turkishNormalize(word: string): string[] {
  const candidates: string[] = [word];
  const lower = word.toLowerCase();

  // Remove apostrophized suffixes: Allah'ın → Allah
  const apostropheIdx = lower.indexOf("'");
  if (apostropheIdx > 0) {
    const after = lower.slice(0, apostropheIdx);
    if (after.length >= 3) candidates.push(after);
  }

  // Try stripping known suffixes
  for (const suffix of TR_SUFFIXES) {
    if (lower.endsWith(suffix) && lower.length - suffix.length >= 3) {
      const stem = lower.slice(0, -suffix.length);

      // Consonant mutation: when suffix was added, final consonant may have changed
      // k→ğ (kitap→kitabı), p→b, ç→c, t→d
      const MUTATIONS: Record<string, string> = { ğ: 'k', b: 'p', c: 'ç', d: 't' };
      const last = stem[stem.length - 1];
      if (last && MUTATIONS[last]) {
        const mutated = stem.slice(0, -1) + MUTATIONS[last]!;
        candidates.push(mutated);
      }

      if (stem.length >= 3) {
        candidates.push(stem);
      }
    }
  }

  // Deduplicate — keep order
  return [...new Set(candidates)];
}

export const createRisaleLugatProvider = (appService: AppService): DictionaryProvider => {
  let db: DatabaseService | null = null;
  let initPromise: Promise<DatabaseService | null> | null = null;

  const getDb = async (): Promise<DatabaseService | null> => {
    if (db) return db;
    if (initPromise) return initPromise;

    initPromise = (async () => {
      try {
        // On web platform, we need to ensure the DB exists in OPFS.
        // It's shipped in the public/data directory.
        if (appService.appPlatform === 'web') {
          try {
            const root = await navigator.storage.getDirectory();
            const pathInfo = await appService.resolveFilePath?.('lugat.db', 'Data');
            const targetName = pathInfo
              ? pathInfo.replace(/[/\\]+/g, '_').replace(/^_+/, '')
              : 'lugat.db';
            // Cache-busting key — bump DB_VERSION when lugat.db schema changes
            const DB_VERSION = 2;
            const versionKey = `${targetName}.version`;

            let needsFetch = true;
            try {
              const versionHandle = await root.getFileHandle(versionKey);
              const versionFile = await versionHandle.getFile();
              const storedVersion = parseInt(await versionFile.text()) || 0;
              if (storedVersion >= DB_VERSION) {
                needsFetch = false;
              }
            } catch (_e) {
              needsFetch = true;
            }

            if (needsFetch) {
              console.log(`Fetching lugat.db v${DB_VERSION} into OPFS...`, targetName);
              const response = await fetch('/data/lugat.db');
              if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                const fileHandle = await root.getFileHandle(targetName, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(arrayBuffer);
                await writable.close();
                // Write version stamp
                const vHandle = await root.getFileHandle(versionKey, { create: true });
                const vWritable = await vHandle.createWritable();
                await vWritable.write(String(DB_VERSION));
                await vWritable.close();
                console.log('lugat.db successfully written to OPFS');
              }
            }
          } catch (e) {
            console.warn('OPFS preloading failed:', e);
          }
        }

        db = await appService.openDatabase('lugat', 'lugat.db', 'Data');
        return db;
      } catch (error) {
        console.error('Failed to open lugat database', error);
        return null;
      }
    })();

    return initPromise;
  };

  return {
    id: BUILTIN_PROVIDER_IDS.risaleLugat,
    kind: 'builtin',
    label: _('Risale Lugat'),

    async lookup(word, ctx) {
      const database = await getDb();
      if (!database) {
        return { ok: false, reason: 'error', message: 'Database not available' };
      }

      try {
        const query = word.toLowerCase();
        const level = ctx.dictionaryLevel ?? 3; // Default to Tümü
        const levelClause = level < 3 ? 'AND level >= ?' : '';

        let results: LugatEntry[] | null = null;

        // ── Multi-step lookup (Turkish agglutination aware) ──

        // Step 1: Exact match on original query
        const exactParams = level < 3 ? [query, level] : [query];
        results = await database.select<LugatEntry>(
          `SELECT term, arabic, definition FROM lugat WHERE term = ? ${levelClause} LIMIT 1`,
          exactParams,
        );

        // Step 2: Prefix LIKE on original query
        if ((!results || results.length === 0) && query.length > 2) {
          const likeParams = level < 3 ? [`${query}%`, level] : [`${query}%`];
          results = await database.select<LugatEntry>(
            `SELECT term, arabic, definition FROM lugat WHERE term LIKE ? ${levelClause} LIMIT 3`,
            likeParams,
          );
        }

        // Step 3: Try normalized candidates (handles agglutination)
        if ((!results || results.length === 0) && query.length > 3) {
          const candidates = turkishNormalize(query);
          for (const cand of candidates) {
            if (cand === query || cand.length < 3) continue;
            // Exact on normalized
            const normParams = level < 3 ? [cand, level] : [cand];
            results = await database.select<LugatEntry>(
              `SELECT term, arabic, definition FROM lugat WHERE term = ? ${levelClause} LIMIT 1`,
              normParams,
            );
            if (results && results.length > 0) break;
            // Prefix on normalized
            const normLikeParams = level < 3 ? [`${cand}%`, level] : [`${cand}%`];
            results = await database.select<LugatEntry>(
              `SELECT term, arabic, definition FROM lugat WHERE term LIKE ? ${levelClause} LIMIT 1`,
              normLikeParams,
            );
            if (results && results.length > 0) break;
          }
        }

        // Step 4: Last resort — infix LIKE (slower but catches compound/suffixed words)
        if ((!results || results.length === 0) && query.length > 4) {
          const infixParams = level < 3 ? [`%${query}%`, level] : [`%${query}%`];
          results = await database.select<LugatEntry>(
            `SELECT term, arabic, definition FROM lugat WHERE term LIKE ? ${levelClause} LIMIT 1`,
            infixParams,
          );
        }

        if (!results || results.length === 0) {
          return { ok: false, reason: 'empty' };
        }

        const entry = results[0]!;
        const hgroup = document.createElement('hgroup');
        const h1 = document.createElement('h1');
        h1.textContent = entry.term;
        h1.className = 'text-lg font-bold';
        hgroup.append(h1);

        if (entry.arabic) {
          const arabicEl = document.createElement('p');
          arabicEl.textContent = entry.arabic;
          arabicEl.dir = 'rtl';
          arabicEl.className = 'text-2xl font-arabic text-right mt-2 mb-1';
          arabicEl.style.fontFamily = '"Traditional Arabic", "Scheherazade New", serif';
          hgroup.append(arabicEl);
        }

        ctx.container.append(hgroup);

        const defEl = document.createElement('div');
        defEl.className = 'mt-4 text-base leading-relaxed whitespace-pre-wrap';
        defEl.textContent = entry.definition;
        ctx.container.append(defEl);

        return { ok: true, headword: entry.term, sourceLabel: 'Risale-i Nur Lugatı' };
      } catch (error) {
        console.error('Lugat lookup failed', error);
        return {
          ok: false,
          reason: 'error',
          message: error instanceof Error ? error.message : String(error),
        };
      }
    },

    dispose() {
      if (db) {
        void db.close();
        db = null;
      }
    },
  };
};
