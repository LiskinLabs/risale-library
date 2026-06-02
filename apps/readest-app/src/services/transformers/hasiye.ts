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

    // Wrap <p class="arabic" ...> and <span class="arabic" ...> or <span dir="rtl" ...> with haşiye metadata
    // so the UI layer can show a popup on click/tap.
    result = result.replace(
      /<(p|span)([^>]*(?:class=["'][^"']*arabic[^"']*["']|dir=["']rtl["'])[^>]*)>(.*?)<\/\1>/gs,
      (_match: string, tag: string, attrs: string, inner: string) => {
        // Extract plain text for meal matching
        const plain = inner.replace(/<[^>]+>/g, '').trim();
        const encoded = Buffer.from(plain).toString('base64');

        // Ensure hasiye-arabic is added to the class attribute without duplicating class attr
        let newAttrs = attrs;
        if (/class=["']/.test(newAttrs)) {
          newAttrs = newAttrs.replace(/class=["']([^"']*)["']/, 'class="$1 hasiye-arabic"');
        } else {
          newAttrs += ' class="hasiye-arabic"';
        }

        return `<${tag}${newAttrs} data-hasiye-text="${encoded}">${inner}</${tag}>`;
      },
    );

    return result;
  },
};
