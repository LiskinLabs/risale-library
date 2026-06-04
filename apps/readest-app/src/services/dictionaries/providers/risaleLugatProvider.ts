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
 * Strip common Turkish suffixes to find the root/stem form.
 * This is a heuristic normalizer — not a full morphological analyzer.
 * It handles the most common derivational and inflectional suffixes
 * that prevent LIKE 'query%' from matching in agglutinated lookups.
 *
 * Examples:
 *   "kitabı"    → "kitap"   (possessive + consonant mutation)
 *   "eserlerin" → "eser"    (plural + genitive)
 *   "imanın"    → "iman"    (genitive)
 *   "Allah'ın"  → "Allah"   (genitive with apostrophe)
 */
function turkishNormalize(word: string): string[] {
  const candidates: string[] = [word];

  // Remove apostrophized suffixes: Allah'ın → Allah
  const apostropheIdx = word.indexOf("'");
  if (apostropheIdx > 0) {
    candidates.push(word.slice(0, apostropheIdx));
  }

  // Aggressive suffix stripping — try removing common suffixes
  const stem = word
    // Plural: -lar, -ler
    .replace(/(?:l[ae]r)$/i, '')
    // Possessive: -(s)I, -(s)i, -(s)ı, -(s)u, -(s)ü, -(n)ın, -(n)in, -(n)un, -(n)ün
    .replace(/(?:[sş]?(?:[ıiuü]|in?[a-z]?))$/i, '')
    // Case suffixes: -da, -de, -ta, -te, -dan, -den, -tan, -ten
    .replace(/(?:[dt][ae]n?)$/i, '')
    // Dative: -(y)A, -(y)a, -(y)e
    .replace(/(?:y?[ae])$/i, '')
    // Other common: -ki, -ken, -ce, -ca, -le, -la
    .replace(/(?:k[ei]|k[ae]n|[cj][ae]|l[ae])$/i, '');

  if (stem && stem !== word && stem.length >= 3) {
    candidates.push(stem);
  }

  return candidates;
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
