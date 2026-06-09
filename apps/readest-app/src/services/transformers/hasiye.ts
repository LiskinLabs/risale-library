import type { Transformer } from './types';

function encodeBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  const binString = Array.from(bytes, (b) => String.fromCodePoint(b)).join('');
  return btoa(binString);
}

const MARKER = 'data-hasiye-done';

/**
 * Haşiye transformer — makes Arabic/Quranic text interactive.
 *
 * Pass 1: Block-level — wraps <p.arabic>, <p.hadith>, <p.basmala> as one clickable unit.
 * Pass 2: Inline — wraps consecutive Arabic text within non-arabic paragraphs.
 *          Skips already-marked blocks (no double-wrapping).
 */
export const hasiyeTransformer: Transformer = {
  name: 'hasiye',

  transform: async (ctx) => {
    const enabledLayers = ctx.viewSettings.enabledLayers || ['user', 'author', 'hasiye', 'lugat'];
    if (!enabledLayers.includes('hasiye')) return ctx.content;

    let result = ctx.content;

    // ── Pass 1: Block-level Arabic ────────────────────────────────
    result = result.replace(
      /<(p|span)([^>]*(?:class=["'][^"']*(?:arabic|hadith|basmala)[^"']*["']|dir=["']rtl["'])[^>]*)>(.*?)<\/\1>/gs,
      (_m: string, tag: string, attrs: string, inner: string) => {
        const plain = inner.replace(/<[^>]+>/g, '').trim();
        if (!plain) return _m;

        let newAttrs = attrs;
        if (/class=["']/.test(newAttrs)) {
          if (!newAttrs.includes('hasiye-arabic')) {
            newAttrs = newAttrs.replace(/class=["']([^"']*)["']/, 'class="$1 hasiye-arabic"');
          }
        } else {
          newAttrs += ' class="hasiye-arabic"';
        }
        newAttrs += ` data-hasiye-text="${encodeBase64(plain)}" ${MARKER}=""`;

        return `<${tag}${newAttrs}>${inner}</${tag}>`;
      },
    );

    // ── Pass 2: Inline Arabic within non-arabic paragraphs ─────────
    result = result.replace(
      /(<p(?!\s[^>]*class=["'][^"']*(?:arabic|hadith|basmala))[^>]*>)(.*?)(<\/p>)/gs,
      (_m: string, openTag: string, inner: string, closeTag: string) => {
        if (inner.includes(MARKER)) return _m;

        // Match Arabic segments: a stretch of Arabic chars + spaces, 4+ chars total
        const arabicRe = /[؀-ۿݐ-ݿࢠ-ࣿ][؀-ۿݐ-ݿࢠ-ࣿ\s]{2,}[؀-ۿݐ-ݿࢠ-ࣿ]/g;

        let out = inner;
        const done = new Set<string>();

        let m: RegExpExecArray | null;
        while ((m = arabicRe.exec(inner)) !== null) {
          const text = m[0];
          const key = text.trim();
          if (done.has(key) || key.length < 4) continue;
          done.add(key);

          const replacement = `<span class="arabic-inline hasiye-arabic" data-hasiye-text="${encodeBase64(key)}" ${MARKER}="">${text}</span>`;
          const idx = out.indexOf(text);
          if (idx >= 0) {
            out = out.substring(0, idx) + replacement + out.substring(idx + text.length);
          }
        }

        return done.size > 0 ? `${openTag}${out}${closeTag}` : _m;
      },
    );

    return result;
  },
};
