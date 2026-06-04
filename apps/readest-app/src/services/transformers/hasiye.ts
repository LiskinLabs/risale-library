import type { Transformer } from './types';

/**
 * Encode a UTF-8 string as Base64 using standard Web APIs.
 * Uses TextEncoder + btoa — works in browser, Node.js, Workers, and WASM.
 */
function encodeBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  const binString = Array.from(bytes, (b) => String.fromCodePoint(b)).join('');
  return btoa(binString);
}

/**
 * Haşiye transformer — makes Arabic/Quranic text interactive.
 *
 * Wraps Arabic/rtl elements with data attributes so the reader UI can
 * attach popup handlers. Meal lookups are performed client-side against
 * the pre-built meal index (see @/services/hasiye/mealIndex).
 *
 * Detection covers:
 * - <p class="arabic"> (block-level aya)
 * - <p class="hadith"> (hadith narration)
 * - <span class="arabic-inline"> (inline Arabic within text)
 * - <span dir="rtl"> (generic RTL text)
 * - <p class="basmala"> (Basmala — ﷽)
 *
 * v2 — improved inline detection + visual underline hint via injected style.
 */
export const hasiyeTransformer: Transformer = {
  name: 'hasiye',

  transform: async (ctx) => {
    // respect layer toggle
    const enabledLayers = ctx.viewSettings.enabledLayers || ['user', 'author', 'hasiye', 'lugat'];
    if (!enabledLayers.includes('hasiye')) return ctx.content;

    let result = ctx.content;

    // ── Pattern 1: Block-level Arabic (p.arabic, p.hadith, p.basmala) ──
    result = result.replace(
      /<(p|span)([^>]*(?:class=["'][^"']*(?:arabic(?:-inline)?|hadith|basmala)[^"']*["']|dir=["']rtl["'])[^>]*)>(.*?)<\/\1>/gs,
      (match: string, tag: string, attrs: string, inner: string) => {
        const plain = inner.replace(/<[^>]+>/g, '').trim();
        if (!plain) return match; // skip empty

        const encoded = encodeBase64(plain);

        // Ensure hasiye-arabic marker class is present
        let newAttrs = attrs;
        if (/class=["']/.test(newAttrs)) {
          if (!newAttrs.includes('hasiye-arabic')) {
            newAttrs = newAttrs.replace(/class=["']([^"']*)["']/, 'class="$1 hasiye-arabic"');
          }
        } else {
          newAttrs += ' class="hasiye-arabic"';
        }

        // Add encoded text for meal lookup
        if (!newAttrs.includes('data-hasiye-text=')) {
          newAttrs = newAttrs.replace(/data-hasiye-text=["'][^"']*["']/, ''); // dedup
          newAttrs += ` data-hasiye-text="${encoded}"`;
        }

        return `<${tag}${newAttrs}>${inner}</${tag}>`;
      },
    );

    // ── Pattern 2: Inline Arabic mixed with Latin text ─────────────────
    // Wraps bare Arabic segments within non-arabic paragraphs
    // e.g. "...rahîm isminin..." → rahîm detected as inline
    // This is a lighter touch — only wraps if there's a clear Arabic word
    result = result.replace(
      /(<p(?!\s[^>]*class=["'][^"']*(?:arabic|hadith|basmala))[^>]*>)(.*?)(<\/p>)/gs,
      (_match: string, openTag: string, inner: string, closeTag: string) => {
        // Only process if paragraph contains mixed Arabic
        const arabicWordRegex = /[؀-ۿݐ-ݿࢠ-ࣿ]{4,}/g;
        let hasArabic = false;
        const processed = inner.replace(arabicWordRegex, (arabic: string) => {
          hasArabic = true;
          const encoded = encodeBase64(arabic.trim());
          return `<span class="arabic-inline hasiye-arabic" data-hasiye-text="${encoded}">${arabic}</span>`;
        });
        return hasArabic ? `${openTag}${processed}${closeTag}` : `${openTag}${inner}${closeTag}`;
      },
    );

    return result;
  },
};
