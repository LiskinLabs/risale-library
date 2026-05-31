import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { LanguageModel, EmbeddingModel } from 'ai';
import type { AIProvider, AISettings, AIProviderName } from '../types';
import { aiLogger } from '../logger';
import { AI_TIMEOUTS } from '../utils/retry';
import { getAIFetch } from '../utils/httpFetch';

const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'openai/gpt-4o-mini';
const DEFAULT_EMBEDDING_MODEL = 'openai/text-embedding-3-small';

export class OpenRouterProvider implements AIProvider {
  id: AIProviderName = 'openrouter';
  name = 'OpenRouter (Custom)';
  requiresAuth = true;
  private settings: AISettings;
  private client: ReturnType<typeof createOpenAICompatible>;
  private baseUrl: string;
  private apiKey: string;
  private httpFetch: typeof fetch;

  constructor(settings: AISettings) {
    this.settings = settings;
    if (!settings.openrouterApiKey) throw new Error('OpenRouter API key required');
    this.apiKey = settings.openrouterApiKey;
    this.baseUrl = (settings.openrouterBaseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.httpFetch = getAIFetch();
    this.client = createOpenAICompatible({
      name: 'openrouter', baseURL: this.baseUrl, apiKey: this.apiKey,
      headers: { 'HTTP-Referer': 'https://TRF.com', 'X-Title': 'TRF' },
      fetch: this.httpFetch,
    });
    aiLogger.provider.init('openrouter', settings.openrouterModel || DEFAULT_MODEL);
  }

  getModel(): LanguageModel { return this.client.chatModel(this.settings.openrouterModel || DEFAULT_MODEL); }
  getEmbeddingModel(): EmbeddingModel { return this.client.textEmbeddingModel(this.settings.openrouterEmbeddingModel || DEFAULT_EMBEDDING_MODEL); }
  async isAvailable(): Promise<boolean> { return !!this.apiKey; }

  async healthCheck(): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      const r = await this.httpFetch(`${this.baseUrl}/models`, {
        method: 'GET', headers: { Authorization: `Bearer ${this.apiKey}` },
        signal: AbortSignal.timeout(AI_TIMEOUTS.HEALTH_CHECK),
      });
      return r.ok;
    } catch (e) { aiLogger.provider.error('openrouter', `healthCheck: ${(e as Error).message}`); return false; }
  }
}

export interface OpenRouterModelInfo { id: string; name?: string; description?: string; context_length?: number; }

export async function fetchOpenRouterModels(baseUrl: string, apiKey: string, signal?: AbortSignal): Promise<OpenRouterModelInfo[]> {
  const u = (baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
  const r = await getAIFetch()(`${u}/models`, { method: 'GET', headers: { Authorization: `Bearer ${apiKey}` }, signal });
  if (!r.ok) throw new Error(`Failed to fetch models: ${r.status}`);
  const j = (await r.json()) as { data?: OpenRouterModelInfo[] };
  return Array.isArray(j.data) ? j.data : [];
}
