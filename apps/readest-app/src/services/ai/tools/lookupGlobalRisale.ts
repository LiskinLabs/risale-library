import { tool, embed } from 'ai';
import { z } from 'zod';
import { supabase } from '@/utils/supabase';
import { getAIProvider } from '../providers';
import type { AISettings } from '../types';
import type { ReedySourceStore } from '../adapters/reedySourceStore';
import type { RetrievedChunk } from '@/services/reedy/retrieval/BookRetriever';

export const globalLookupInputSchema = z.object({
  query: z.string().min(1).max(500).describe('The semantic search query in Turkish or Russian.'),
  topK: z.number().int().min(1).max(5).default(3).describe('Number of passages to return.'),
});

export interface BuildGlobalLookupToolArgs {
  settings: AISettings;
  turnId: string;
  sourceStore: ReedySourceStore;
}

export function buildGlobalLookupTool(args: BuildGlobalLookupToolArgs) {
  const { settings, turnId, sourceStore } = args;

  return tool({
    description:
      'Search across the entire Risale-i Nur library for relevant passages. ' +
      'Use this when the user asks a general question about Risale-i Nur or Islamic topics ' +
      'that might not be in the current book.',
    inputSchema: globalLookupInputSchema,
    async execute({ query, topK }) {
      try {
        const provider = getAIProvider(settings);
        const embeddingModel = provider.getEmbeddingModel();

        // 1. Generate embedding for the query
        const { embedding } = await embed({
          model: embeddingModel,
          value: query,
        });

        // 2. Call Supabase RPC
        const { data, error } = await supabase.rpc('match_risale_passages', {
          query_embedding: embedding,
          match_threshold: 0.5,
          match_count: topK,
        });

        if (error) throw error;

        if (!data || data.length === 0) {
          return {
            status: 'empty',
            message: 'No relevant passages found in the global library.',
          };
        }

        // 3. Map to RetrievedChunk format and append to sourceStore
        const chunks: RetrievedChunk[] = data.map((d: any) => ({
          id: d.id,
          bookHash: 'global',
          cfi: '', // No CFI for global search yet
          endCfi: '',
          sectionIndex: 0,
          chapterTitle: `${d.book_name} | Global`,
          text: d.content,
          score: d.similarity,
        }));

        sourceStore.append(turnId, chunks);

        return {
          status: 'ok',
          passages: chunks.map((c) => ({
            content: c.text,
            book: c.chapterTitle,
            citation: c.chapterTitle,
          })),
        };
      } catch (e) {
        console.error('[GlobalLookup] Failed:', e);
        return {
          status: 'error',
          message: (e as Error).message,
        };
      }
    },
  });
}
