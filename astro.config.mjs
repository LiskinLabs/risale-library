// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import { rehypeLugat } from './src/plugins/rehype-lugat.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://LiskinLabs.github.io',
  base: '/risale-library',
  integrations: [react(), mdx()],

  markdown: {
    rehypePlugins: [rehypeLugat]
  },

  vite: {
    plugins: [tailwindcss()]
  }
});