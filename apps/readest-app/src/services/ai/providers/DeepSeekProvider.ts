import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { LanguageModel, EmbeddingModel } from 'ai';
import type { AIProvider, AISettings, AIProviderName } from '../types';
import { aiLogger } from '../logger';
import { AI_TIMEOUTS } from '../utils/retry';
import { getAIFetch } from '../utils/httpFetch';

const DEFAULT_BASE_URL = 'https://api.deepseek.com/v1';
const DEFAULT_MODEL = 'deepseek-chat';

/** Provider for DeepSeek API (deepseek.com). OpenAI-compatible. DeepSeek does NOT offer embedding models. */
export class DeepSeekProvider implements AIProvider {
  id: AIProviderName = 'deepseek';
  name = 'DeepSeek';
  requiresAuth = true;
  private settings: AISettings;
  private client: ReturnType<typeof createOpenAICompatible>;
  private baseUrl: string;
  private apiKey: string;
  private httpFetch: typeof fetch;

  constructor(settings: AISettings) {
    this.settings = settings;
    if (!settings.deepseekApiKey) throw new Error('DeepSeek API key required');
    this.apiKey = settings.deepseekApiKey;
    this.baseUrl = DEFAULT_BASE_URL;
    this.httpFetch = getAIFetch();
    this.client = createOpenAICompatible({
      name: 'deepseek', baseURL: this.baseUrl, apiKey: this.apiKey, fetch: this.httpFetch,
    });
    aiLogger.provider.init('deepseek', settings.deepseekModel || DEFAULT_MODEL);
  }

  getModel(): LanguageModel { return this.client.chatModel(this.settings.deepseekModel || DEFAULT_MODEL); }

  getEmbeddingModel(): EmbeddingModel {
    const modelId = this.settings.deepseekEmbeddingModel;
    if (!modelId) throw new Error('DeepSeek does not offer embedding models. Configure an embedding model in DeepSeek settings or disable RAG features.');
    return this.client.textEmbeddingModel(modelId);
  }

  async isAvailable(): Promise<boolean> { return !!this.apiKey; }

  async healthCheck(): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      const r = await this.httpFetch(`${this.baseUrl}/models`, {
        method: 'GET', headers: { Authorization: `Bearer ${this.apiKey}` },
        signal: AbortSignal.timeout(AI_TIMEOUTS.HEALTH_CHECK),
      });
      return r.ok;
    } catch (e) { aiLogger.provider.error('deepseek', `healthCheck: ${(e as Error).message}`); return false; }
  }
}

export interface DeepSeekModelInfo { id: string; object?: string; owned_by?: string; }

export async function fetchDeepSeekModels(apiKey: string, signal?: AbortSignal): Promise<DeepSeekModelInfo[]> {
  const r = await getAIFetch()(`${DEFAULT_BASE_URL}/models`, { method: 'GET', headers: { Authorization: `Bearer ${apiKey}` }, signal });
  if (!r.ok) throw new Error(`Failed to fetch models: ${r.status}`);
  const j = (await r.json()) as { data?: DeepSeekModelInfo[] };
  return Array.isArray(j.data) ? j.data : [];
}
