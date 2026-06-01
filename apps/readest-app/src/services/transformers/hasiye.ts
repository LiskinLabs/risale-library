import type { Transformer } from './types';

/**
 * Haşiye transformer — makes Arabic/Quranic text interactive.
 *
 * Wraps Arabic paragraphs with data attributes so the reader UI can
 * attach popup handlers.  Meal lookups are performed client-side
 * against the pre-built meal index (see @/services/hasiye/mealIndex).
 */
export const hasiyeTransformer: Transformer = {
  name: 'hasiye',

  transform: async (ctx) => {
    let result = ctx.content;

    // Wrap <p class="arabic"> with haşiye metadata so the UI layer
    // can show a popup on click/tap.
    result = result.replace(/<p\s+class="arabic">(.*?)<\/p>/gs, (_match: string, inner: string) => {
      // Extract plain text for meal matching
      const plain = inner.replace(/<[^>]+>/g, '').trim();
      const encoded = Buffer.from(plain).toString('base64');
      return `<p class="arabic hasiye-arabic" data-hasiye-text="${encoded}">${inner}</p>`;
    });

    return result;
  },
};
