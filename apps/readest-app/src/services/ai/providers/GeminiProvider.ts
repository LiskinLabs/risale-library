import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { LanguageModel, EmbeddingModel } from 'ai';
import type { AIProvider, AISettings, AIProviderName } from '../types';
import { aiLogger } from '../logger';
import { AI_TIMEOUTS } from '../utils/retry';
import { getAIFetch } from '../utils/httpFetch';

const DEFAULT_MODEL = 'gemini-2.5-flash';
const DEFAULT_EMBEDDING_MODEL = 'text-embedding-004';

export class GeminiProvider implements AIProvider {
  id: AIProviderName = 'gemini';
  name = 'Google Gemini';
  requiresAuth = true;
  private settings: AISettings;
  private client: ReturnType<typeof createGoogleGenerativeAI>;
  private apiKey: string;

  constructor(settings: AISettings) {
    this.settings = settings;
    if (!settings.geminiApiKey) throw new Error('Gemini API key required');
    this.apiKey = settings.geminiApiKey;
    this.client = createGoogleGenerativeAI({ apiKey: this.apiKey });
    aiLogger.provider.init('gemini', settings.geminiModel || DEFAULT_MODEL);
  }

  getModel(): LanguageModel { return this.client(this.settings.geminiModel || DEFAULT_MODEL); }
  getEmbeddingModel(): EmbeddingModel { return this.client.textEmbeddingModel(DEFAULT_EMBEDDING_MODEL); }
  async isAvailable(): Promise<boolean> { return !!this.apiKey; }

  async healthCheck(): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      const modelId = this.settings.geminiModel || DEFAULT_MODEL;
      const r = await getAIFetch()(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`,
        { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.apiKey },
          body: JSON.stringify({ contents: [{ parts: [{ text: 'hi' }] }] }),
          signal: AbortSignal.timeout(AI_TIMEOUTS.HEALTH_CHECK) },
      );
      if (!r.ok) throw new Error(`Health check failed: ${r.status}`);
      return true;
    } catch (e) { aiLogger.provider.error('gemini', `healthCheck: ${(e as Error).message}`); return false; }
  }
}
