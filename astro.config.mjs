// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import { rehypeLugat } from './src/plugins/rehype-lugat.mjs';
import { remarkRtlAttrs } from './src/plugins/remark-rtl-attrs.mjs';

const isGithubPages = process.env.GITHUB_PAGES === 'true';

// https://astro.build/config
export default defineConfig({
  site: 'https://LiskinLabs.github.io',
  base: isGithubPages ? '/risale-library' : undefined,
  integrations: [react(), mdx()],

  markdown: {
    smartypants: false,
    remarkPlugins: [remarkRtlAttrs],
    rehypePlugins: [rehypeLugat]
  },

  vite: {
    plugins: [tailwindcss()]
  }
});