import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { LanguageModel, EmbeddingModel } from 'ai';
import type { AIProvider, AISettings, AIProviderName } from '../types';
import { aiLogger } from '../logger';
import { AI_TIMEOUTS } from '../utils/retry';
import { GEMINI_MODELS } from '../constants';

const DEFAULT_MODEL = GEMINI_MODELS.FLASH;
const DEFAULT_EMBEDDING_MODEL = GEMINI_MODELS.EMBEDDING;

/**
 * Native Google Gemini provider via @ai-sdk/google.
 *
 * Talks directly to the Gemini API (https://generativelanguage.googleapis.com)
 * using an API key obtained from Google AI Studio (https://aistudio.google.com).
 * No proxy or intermediary — lower latency and full access to Gemini-specific
 * features (safety settings, Google Search grounding, etc.).
 *
 * The underlying @ai-sdk/google package wraps the Gemini REST API into the
 * Vercel AI SDK's LanguageModel interface, so streaming, tool calling,
 * structured output, and embeddings all work through the same `ai` package
 * primitives used by every other provider.
 */
export class GeminiProvider implements AIProvider {
  id: AIProviderName = 'gemini';
  name = 'Google Gemini';
  requiresAuth = true;

  private settings: AISettings;
  private google: ReturnType<typeof createGoogleGenerativeAI>;
  private apiKey: string;

  constructor(settings: AISettings) {
    this.settings = settings;
    if (!settings.geminiApiKey) {
      throw new Error('Gemini API key required');
    }
    this.apiKey = settings.geminiApiKey;
    this.google = createGoogleGenerativeAI({ apiKey: this.apiKey });
    aiLogger.provider.init('gemini', settings.geminiModel || DEFAULT_MODEL);
  }

  getModel(): LanguageModel {
    const modelId = this.settings.geminiModel || DEFAULT_MODEL;
    return this.google(modelId);
  }

  getEmbeddingModel(): EmbeddingModel {
    const modelId = this.settings.geminiEmbeddingModel || DEFAULT_EMBEDDING_MODEL;
    return this.google.textEmbeddingModel(modelId);
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async healthCheck(): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      const modelId = this.settings.geminiModel || DEFAULT_MODEL;
      aiLogger.provider.init('gemini', `healthCheck starting with model: ${modelId}`);

      // Use the model's doGenerate to send a tiny probe. The Vercel AI SDK
      // LanguageModel v2 spec provides a doGenerate method; we call it with
      // a minimal prompt to confirm the API key works and the model responds.
      const model = this.google(modelId) as LanguageModel & {
        doGenerate?: (opts: {
          prompt: Array<{ role: 'user'; content: Array<{ type: 'text'; text: string }> }>;
          abortSignal?: AbortSignal;
        }) => Promise<unknown>;
      };

      if (model.doGenerate) {
        await model.doGenerate({
          prompt: [{ role: 'user', content: [{ type: 'text', text: 'hi' }] }],
          abortSignal: AbortSignal.timeout(AI_TIMEOUTS.HEALTH_CHECK),
        });
      } else {
        // Fallback: just check that the key is non-empty and the provider
        // constructed successfully. Some LanguageModel implementations don't
        // expose doGenerate directly until used via streamText/generateText.
        aiLogger.provider.init('gemini', 'healthCheck skipped (model has no doGenerate)');
      }

      aiLogger.provider.init('gemini', 'healthCheck success');
      return true;
    } catch (e) {
      aiLogger.provider.error('gemini', `healthCheck failed: ${(e as Error).message}`);
      return false;
    }
  }
}
