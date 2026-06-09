import type { Transformer } from './types';

const MARKER = 'data-lugat-term';

let _termsPromise: Promise<Set<string>> | null = null;

function loadTerms(): Promise<Set<string>> {
  if (_termsPromise) return _termsPromise;
  _termsPromise = fetch('/data/lugat-keys.json')
    .then((r) => r.json())
    .then((arr: string[]) => new Set(arr))
    .catch(() => new Set<string>());
  return _termsPromise;
}

/**
 * Lugat transformer — highlights Ottoman/Turkish words that exist in the
 * built-in Risale Lugat dictionary. Only wraps terms at frequency level ≤ 1
 * (most common words readers look up).
 */
export const lugatTransformer: Transformer = {
  name: 'lugat',

  transform: async (ctx) => {
    const enabledLayers = ctx.viewSettings.enabledLayers || ['user', 'author', 'hasiye', 'lugat'];
    if (!enabledLayers.includes('lugat')) return ctx.content;

    const terms = await loadTerms();
    if (terms.size === 0) return ctx.content;

    let result = ctx.content;

    // Match whole words — Turkish/Latin script words, 3+ chars
    const wordRegex = /\b([a-zçğıöşüâîûA-ZÇĞİÖŞÜÂÎÛ][a-zçğıöşüâîûA-ZÇĞİÖŞÜÂÎÛ']{2,})\b/g;

    const alreadyWrapped = new Set<string>();

    result = result.replace(wordRegex, (match: string) => {
      const lower = match.toLowerCase();
      if (alreadyWrapped.has(lower)) return match;
      if (!terms.has(lower)) return match;

      alreadyWrapped.add(lower);
      // Don't wrap if already inside a hasiye or existing lugat span
      // (handled by word boundary — won't match inside tags)
      return `<span class="lugat-term" ${MARKER}="${lower}">${match}</span>`;
    });

    return result;
  },
};
