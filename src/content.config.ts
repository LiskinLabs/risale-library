import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const risaleCollection = defineCollection({
	loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/risale' }),
	schema: z.object({
		title: z.string(),
		book: z.string().optional(),
		chapter: z.number().optional(),
		dir: z.enum(['ltr', 'rtl']).optional().default('ltr'),
		category: z.enum(['main', 'small', 'prayers', 'other']).optional().default('other'),
		order: z.number().optional(),
	}),
});

export const collections = {
	'risale': risaleCollection,
};
