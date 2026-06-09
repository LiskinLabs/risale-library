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
 * built-in Risale Lugat dictionary. Only wraps text nodes, not HTML tags.
 * Uses a two-pass approach: collect terms → replace in text content only.
 */
export const lugatTransformer: Transformer = {
  name: 'lugat',

  transform: async (ctx) => {
    const enabledLayers = ctx.viewSettings.enabledLayers || ['user', 'author', 'hasiye', 'lugat'];
    if (!enabledLayers.includes('lugat')) return ctx.content;

    const terms = await loadTerms();
    if (terms.size === 0) return ctx.content;

    let result = ctx.content;

    // Push all matching terms into a single pass — find text between > and <
    result = result.replace(
      />([^<]+)</g,
      (_full: string, text: string) => {
        let wrapped = text;
        // Match whole words (Turkish/Latin, 3+ chars)
        const wordRe = /\b([a-zçğıöşüâîûA-ZÇĞİÖŞÜÂÎÛ'][a-zçğıöşüâîûA-ZÇĞİÖŞÜÂÎÛ']{2,})\b/g;

        const alreadyDone = new Set<string>();

        wrapped = wrapped.replace(wordRe, (match: string) => {
          const lower = match.toLowerCase();
          if (alreadyDone.has(lower) || !terms.has(lower)) return match;
          alreadyDone.add(lower);
          return `<span class="lugat-term" ${MARKER}="${lower}">${match}</span>`;
        });

        return `>${wrapped}<`;
      },
    );

    return result;
  },
};
