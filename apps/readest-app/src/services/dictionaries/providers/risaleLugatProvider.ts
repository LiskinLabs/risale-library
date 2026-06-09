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
  // Possessive + case + postposition combos (longest first)
  'larındaki', 'lerindeki',
  'larındaki', 'lerindeki',
  'larından', 'lerinden',
  'larındaki', 'lerindeki',
  'larında', 'lerinde',
  'larına', 'lerine',
  'larıyla', 'leriyle',
  'larıdır', 'leridir',
  // Plural + possessive + case
  'larımızdan', 'lerimizden',
  'larımızda', 'lerimizde',
  'larımıza', 'lerimize',
  'larımızı', 'lerimizi',
  'larımız', 'lerimiz',
  'larınızdan', 'lerinizden',
  'larınızda', 'lerinizde',
  'larınıza', 'lerinize',
  'larınızı', 'lerinizi',
  'larınız', 'leriniz',
  'larının', 'lerinin',
  'larıma', 'lerime',
  'larını', 'lerini',
  // Plural + case
  'lardan', 'lerden',
  'larda', 'lerde',
  'lara', 'lere',
  'ları', 'leri',
  'lar', 'ler',
  // Verbal nouns (mastar) + case/possessive
  'maktandır', 'mektendir',
  'maktan', 'mekten',
  'makta', 'mekte',
  'maktır', 'mektir',
  'masından', 'mesinden',
  'masında', 'mesinde',
  'masına', 'mesine',
  'masını', 'mesini',
  'masıdır', 'mesidir',
  'ması', 'mesi',
  'makla', 'mekle',
  'mak', 'mek',
  // Participles / gerunds with case endings
  'dıklarından', 'diklerinden',
  'dıklarında', 'diklerinde',
  'dıkları', 'dikleri',
  'dıktan', 'dikten', 'duktan', 'dükten',
  'dığından', 'diğinden', 'duğundan', 'düğünden',
  'dığında', 'diğinde', 'duğunda', 'düğünde',
  'dığını', 'diğini', 'duğunu', 'düğünü',
  'dığıdır', 'diğidir', 'duğudur', 'düğüdür',
  'dığı', 'diği', 'duğu', 'düğü',
  // Adverbial participles (ulaç/gerund)
  'arak', 'erek',
  'ınca', 'ince', 'unca', 'ünce',
  'ıp', 'ip', 'up', 'üp',
  'alı', 'eli',
  'madan', 'meden',
  // Possessive suffixes
  'ımız', 'imiz', 'umuz', 'ümüz',
  'ınız', 'iniz', 'unuz', 'ünüz',
  'ının', 'inin', 'unun', 'ünün',
  'ına', 'ine', 'una', 'üne',
  'ım', 'im', 'um', 'üm',
  'ın', 'in', 'un', 'ün',
  'ı', 'i', 'u', 'ü',
  'sı', 'si', 'su', 'sü',
  // Case suffixes
  'ndan', 'nden', 'ntan', 'nten',
  'nda', 'nde', 'nta', 'nte',
  'dan', 'den', 'tan', 'ten',
  'da', 'de', 'ta', 'te',
  'a', 'e', // dative: -(y)a, -(y)e (stripped after buffer-letter removal)
  'ı', 'i', 'u', 'ü', // accusative: -(y)ı
  // Buffer letter + case (y-insertion)
  'nın', 'nin', 'nun', 'nün',
  'na', 'ne',
  'nı', 'ni', 'nu', 'nü',
  'yla', 'yle',
  'la', 'le',
  // Copula / predicative
  'dir', 'dır', 'dur', 'dür',
  'tir', 'tır', 'tur', 'tür',
  // Derivational
  'lık', 'lik', 'luk', 'lük',
  'sız', 'siz', 'suz', 'süz',
  'lı', 'li', 'lu', 'lü',
  'cı', 'ci', 'cu', 'cü',
  'çı', 'çi', 'çu', 'çü',
  'cık', 'cik', 'cuk', 'cük',
  'ceğiz', 'cağız',
  'ce', 'ca', 'çe', 'ça',
  'cik', 'cık',
  // Other common endings
  'ken',
  'ki', 'kü',
  'deki', 'daki', 'teki', 'taki',
  // Diminutive / affective
  'cik', 'cık', 'cük', 'cuk',
  'ciğim', 'cığım', 'cüğüm', 'cuğum',
  // Agentive
  'ici', 'ıcı', 'ücü', 'ucu',
  // Gerundial
  'ış', 'iş', 'uş', 'üş',
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
        // On web / node platforms, the lugat.db SQLite file ships in
        // public/data/ but needs to be copied to the app's Data directory.
        const platform = appService.appPlatform;
        const needsSeeding = platform === 'web' || platform === 'node' || platform === 'tauri';

        if (needsSeeding) {
          // Open first (may create an empty DB if file is missing or stale)
          const candidate = await appService.openDatabase('lugat', 'lugat.db', 'Data');
          try {
            const rows = await candidate.select<{ cnt: number }>(
              'SELECT COUNT(*) as cnt FROM lugat',
            );
            if (!rows?.[0] || rows[0].cnt === 0) {
              // DB is empty — close it and replace with the real data
              await candidate.close();
              console.log(
                `Seeding lugat.db for ${platform} (DB was empty or missing)...`,
              );
              const response = await fetch('/data/lugat.db');
              if (response.ok) {
                const buf = await response.arrayBuffer();
                const file = new File([buf], 'lugat.db');
                try {
                  await appService.writeFile('lugat.db', 'Data', file);
                } catch (writeErr) {
                  console.error('Failed to write lugat.db:', writeErr);
                  // Fallback: try direct copy via saveFile if writeFile fails
                }
                db = await appService.openDatabase('lugat', 'lugat.db', 'Data');
                const verify = await db.select<{ cnt: number }>(
                  'SELECT COUNT(*) as cnt FROM lugat',
                );
                console.log(
                  `lugat.db seeded: ${verify?.[0]?.cnt ?? '?'} rows`,
                );
                return db;
              }
              console.warn(`Failed to fetch lugat.db: HTTP ${response.status}`);
            } else {
              db = candidate;
              return db;
            }
          } catch (e) {
            await candidate.close().catch(() => {});
            console.warn('lugat.db seed check failed, will try fresh open:', e);
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

        // Step 5: FTS fallback — token-based search catches words the stemmer missed.
        // Splits the query into tokens and searches each term individually.
        if ((!results || results.length === 0) && query.length > 3) {
          try {
            const tokens = query
              .split(/[\s\-',.!?]+/)
              .filter((t) => t.length >= 3)
              .slice(0, 3); // max 3 tokens
            for (const token of tokens) {
              const ftsParams = level < 3 ? [token, level] : [token];
              results = await database.select<LugatEntry>(
                `SELECT term, arabic, definition FROM lugat WHERE term = ? ${levelClause} LIMIT 1`,
                ftsParams,
              );
              if (results && results.length > 0) break;
              // Prefix on token
              const ftsLikeParams = level < 3 ? [`${token}%`, level] : [`${token}%`];
              results = await database.select<LugatEntry>(
                `SELECT term, arabic, definition FROM lugat WHERE term LIKE ? ${levelClause} LIMIT 1`,
                ftsLikeParams,
              );
              if (results && results.length > 0) break;
            }
          } catch {
            // FTS fallback is best-effort; silent failure is acceptable
          }
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
