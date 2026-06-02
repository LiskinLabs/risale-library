/**
 * Simple LRU cache for dictionary lookups.
 *
 * Caches in memory for the session and optionally persists to localStorage
 * so repeated lookups of the same word (across book opens, etc.) hit the
 * cache instead of the network. Limits total stored entries to avoid
 * ballooning storage.
 */

interface CacheEntry {
  html: string;
  sourceLabel: string;
  ts: number;
}

const MAX_MEMORY_ENTRIES = 200;

export class DictCache {
  private memory = new Map<string, CacheEntry>();

  /** Build a cache key from provider + word + language. */
  static key(providerId: string, word: string, lang?: string): string {
    const normalized = word.trim().toLowerCase();
    const langPart = lang ? `:${lang}` : '';
    return `${providerId}:${normalized}${langPart}`;
  }

  get(key: string): CacheEntry | undefined {
    const entry = this.memory.get(key);
    if (entry) {
      // Refresh LRU position
      this.memory.delete(key);
      this.memory.set(key, entry);
      return entry;
    }
    // Try localStorage
    try {
      const raw = localStorage.getItem(`dict:${key}`);
      if (raw) {
        const parsed = JSON.parse(raw) as CacheEntry;
        // Don't cache entries older than 24 hours
        if (Date.now() - parsed.ts < 86400000) {
          this.memory.set(key, parsed);
          return parsed;
        }
        localStorage.removeItem(`dict:${key}`);
      }
    } catch {
      // localStorage unavailable or corrupted — ignore
    }
    return undefined;
  }

  set(key: string, html: string, sourceLabel: string): void {
    const entry: CacheEntry = { html, sourceLabel, ts: Date.now() };
    this.memory.set(key, entry);
    // Evict oldest if over capacity
    while (this.memory.size > MAX_MEMORY_ENTRIES) {
      const oldest = this.memory.keys().next().value;
      if (oldest) this.memory.delete(oldest);
    }
    // Persist to localStorage (best-effort)
    try {
      localStorage.setItem(`dict:${key}`, JSON.stringify(entry));
    } catch {
      // Storage full or unavailable — fine, memory cache still works
    }
  }

  /** Drop all entries for a given provider (e.g. when provider is removed). */
  invalidateProvider(providerId: string): void {
    for (const key of this.memory.keys()) {
      if (key.startsWith(`${providerId}:`)) this.memory.delete(key);
    }
    // Can't efficiently clear localStorage entries — they'll expire naturally
  }
}

/** Singleton instance shared across all dictionary providers. */
export const dictCache = new DictCache();
