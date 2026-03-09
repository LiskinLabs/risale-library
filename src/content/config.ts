import { defineCollection, z } from 'astro:content';

const risaleCollection = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string(),
		book: z.string().optional(),
		chapter: z.number().optional(),
		dir: z.enum(['ltr', 'rtl']).optional().default('ltr'),
	}),
});

export const collections = {
	'risale': risaleCollection,
};
