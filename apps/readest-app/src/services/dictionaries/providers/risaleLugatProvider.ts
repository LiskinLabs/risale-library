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

            try {
              await root.getFileHandle(targetName);
            } catch (_e) {
              // File doesn't exist in OPFS, fetch it
              console.log('Fetching lugat.db into OPFS...', targetName);
              const response = await fetch('/data/lugat.db');
              if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                const fileHandle = await root.getFileHandle(targetName, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(arrayBuffer);
                await writable.close();
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

        // level 3 means show everything
        const levelClause = level < 3 ? 'AND level >= ?' : '';
        const params = level < 3 ? [query, level] : [query];

        // 1. Try exact term match
        let results = await database.select<LugatEntry>(
          `SELECT term, arabic, definition FROM lugat WHERE term = ? ${levelClause} LIMIT 1`,
          params,
        );

        // 2. Fallback to search if no exact match or word has potential suffixes
        if ((!results || results.length === 0) && query.length > 2) {
          if (appService.appPlatform === 'web') {
            // FTS5 is not available in WASM, use LIKE
            const likeParams = level < 3 ? [`${query}%`, level] : [`${query}%`];
            results = await database.select<LugatEntry>(
              `SELECT term, arabic, definition FROM lugat WHERE term LIKE ? ${levelClause} LIMIT 1`,
              likeParams,
            );
          } else {
            const ftsLevelClause =
              level < 3 ? 'AND id IN (SELECT id FROM lugat WHERE level >= ?)' : '';
            const ftsParams = level < 3 ? [query, level] : [query];
            results = await database.select<LugatEntry>(
              `SELECT term, arabic, definition FROM lugat WHERE id IN (SELECT rowid FROM lugat_fts WHERE term MATCH ?) ${ftsLevelClause} LIMIT 1`,
              ftsParams,
            );
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
