import type { Transformer } from './types';

/**
 * Encode a UTF-8 string as Base64 using standard Web APIs.
 */
function encodeBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  const binString = Array.from(bytes, (b) => String.fromCodePoint(b)).join('');
  return btoa(binString);
}

/**
 * Haşiye transformer — makes Arabic/Quranic text interactive.
 *
 * Wraps Arabic blocks with data attributes so the reader UI can
 * attach popup handlers. Meal lookups are performed client-side against
 * the pre-built meal index.
 *
 * v3 — groups consecutive inline Arabic into one unit,
 *      block-level ayahs get the full paragraph as one clickable element.
 */
export const hasiyeTransformer: Transformer = {
  name: 'hasiye',

  transform: async (ctx) => {
    const enabledLayers = ctx.viewSettings.enabledLayers || ['user', 'author', 'hasiye', 'lugat'];
    if (!enabledLayers.includes('hasiye')) return ctx.content;

    let result = ctx.content;

    // ── Pattern 1: Block-level Arabic (p.arabic, p.hadith, p.basmala) ──
    // Wrap the ENTIRE block as one clickable unit
    result = result.replace(
      /<(p|span)([^>]*(?:class=["'][^"']*(?:arabic(?:-inline)?|hadith|basmala)[^"']*["']|dir=["']rtl["'])[^>]*)>(.*?)<\/\1>/gs,
      (match: string, tag: string, attrs: string, inner: string) => {
        const plain = inner.replace(/<[^>]+>/g, '').trim();
        if (!plain) return match;

        const encoded = encodeBase64(plain);

        let newAttrs = attrs;
        if (/class=["']/.test(newAttrs)) {
          if (!newAttrs.includes('hasiye-arabic')) {
            newAttrs = newAttrs.replace(/class=["']([^"']*)["']/, 'class="$1 hasiye-arabic"');
          }
        } else {
          newAttrs += ' class="hasiye-arabic"';
        }

        if (!newAttrs.includes('data-hasiye-text=')) {
          newAttrs += ` data-hasiye-text="${encoded}"`;
        }

        return `<${tag}${newAttrs}>${inner}</${tag}>`;
      },
    );

    // ── Pattern 2: Inline Arabic within non-arabic paragraphs ──────────
    // Groups CONSECUTIVE Arabic text into one clickable unit
    result = result.replace(
      /(<p(?!\s[^>]*class=["'][^"']*(?:arabic|hadith|basmala))[^>]*>)(.*?)(<\/p>)/gs,
      (_match: string, openTag: string, inner: string, closeTag: string) => {
        // Find Arabic segments (words + spaces between them) of 4+ chars
        const arabicSegmentRegex = /[؀-ۿݐ-ݿࢠ-ࣿ](?:[\s؀-ۿݐ-ݿࢠ-ࣿ]{3,})?[؀-ۿݐ-ݿࢠ-ࣿ]/g;

        let result2 = inner;
        const seen = new Set<string>();

        // Replace matching Arabic segments, longest first
        const matches: Array<{ text: string; index: number }> = [];
        let m: RegExpExecArray | null;
        while ((m = arabicSegmentRegex.exec(inner)) !== null) {
          matches.push({ text: m[0], index: m.index });
        }

        // Process from right to left to preserve indices
        for (const match of matches.reverse()) {
          const key = match.text.trim();
          if (seen.has(key)) continue;
          seen.add(key);

          const encoded = encodeBase64(key);
          const replacement = `<span class="arabic-inline hasiye-arabic" data-hasiye-text="${encoded}">${match.text}</span>`;
          result2 = result2.substring(0, match.index) + replacement + result2.substring(match.index + match.text.length);
        }

        return seen.size > 0 ? `${openTag}${result2}${closeTag}` : `${openTag}${inner}${closeTag}`;
      },
    );

    return result;
  },
};
