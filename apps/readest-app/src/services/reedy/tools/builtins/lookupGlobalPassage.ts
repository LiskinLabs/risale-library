import { z } from 'zod';
import type { ReedyTool } from '../types';
import type { BookRetriever, RetrieverStatus } from '@/services/reedy/retrieval/BookRetriever';
import type { EmbeddingModel } from '@/services/reedy/models/EmbeddingModel';

/**
 * Phase 2.4 / 1.2 — Global Külliyat Search tool.
 *
 * Searches across all indexed books in the local Reedy index.
 * Used for broad thematic queries or finding quotes when the user
 * doesn't know which book the passage belongs to.
 */

const inputSchema = z.object({
  query: z.string().min(1).max(500),
  topK: z.number().int().min(1).max(10).default(5),
});

export interface LookupGlobalPassageDeps {
  retriever: BookRetriever;
  activeEmbeddingModel: EmbeddingModel;
}

export interface LookupGlobalPassageResult {
  passages: Array<{
    bookHash: string;
    cfi: string;
    endCfi: string;
    chapter: string | null;
    text: string;
    score: number;
  }>;
  status: RetrieverStatus;
  reason?: string;
}

export function createLookupGlobalPassageTool(
  deps: LookupGlobalPassageDeps,
): ReedyTool<z.input<typeof inputSchema>, LookupGlobalPassageResult> {
  return {
    name: 'lookupGlobalPassage',
    description:
      "Search the entire Risale-i Nur collection (Külliyat) for passages relevant to a query. Returns topK results from across all indexed books. Use this for general questions or when the answer isn't in the current book.",
    permission: 'read',
    parallelSafe: true,
    inputSchema,
    async run(args) {
      const parsed = inputSchema.parse(args);
      const res = await deps.retriever.globalSearch({
        query: parsed.query,
        k: parsed.topK,
        activeEmbeddingModel: deps.activeEmbeddingModel,
      });
      return {
        passages: res.passages.map((p) => ({
          bookHash: p.bookHash,
          cfi: p.cfi,
          endCfi: p.endCfi,
          chapter: p.chapterTitle,
          text: p.text,
          score: p.score,
        })),
        status: res.status,
        reason: res.reason,
      };
    },
  };
}
