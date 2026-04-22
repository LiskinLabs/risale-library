/**
 * remark-rtl-attrs.mjs
 * 
 * A remark plugin that strips Pandoc-style attribute notation `[...]{dir="rtl"}`
 * from markdown content. Since the inner HTML already contains `<span class="arabic" dir="rtl">`,
 * the outer `[...]{dir="rtl"}` wrapper is redundant and confuses the default remark parser.
 * 
 * Handles both straight quotes (" ") and smart/curly quotes (\u201C \u201D) since
 * markdown's smartypants/typographic transforms convert them automatically.
 * 
 * Also handles the `~...|@` (centered Arabic block) pattern.
 */
import { visit } from 'unist-util-visit';

export function remarkRtlAttrs() {
  return (tree) => {
    visit(tree, 'text', (node, _index, parent) => {
      if (!parent) return;

      let value = node.value;
      let changed = false;

      // Pattern 1: Strip outer [...]{dir="rtl"} wrappers
      // Handle both straight quotes and smart/curly quotes
      // Straight: {dir="rtl"}
      // Smart:    {dir=\u201Crtl\u201D}
      const rtlPattern = /\[([^\]]*)\]\{dir=[""\u201C]rtl[""\u201D]\}/g;
      if (rtlPattern.test(value)) {
        // Reset lastIndex after test()
        rtlPattern.lastIndex = 0;
        value = value.replace(rtlPattern, '$1');
        changed = true;
      }

      // Pattern 2: Strip ~...|@ centered Arabic block markers
      const centeredPattern = /~([^|]+)\|@/g;
      if (centeredPattern.test(value)) {
        centeredPattern.lastIndex = 0;
        value = value.replace(centeredPattern, '<div class="arabic-centered" dir="rtl">$1</div>');
        changed = true;
      }

      if (changed) {
        node.value = value;
      }
    });
  };
}
