import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { LanguageModel, EmbeddingModel } from 'ai';
import type { AIProvider, AISettings, AIProviderName } from '../types';
import { aiLogger } from '../logger';
import { AI_TIMEOUTS } from '../utils/retry';
import { getAIFetch } from '../utils/httpFetch';
import { DEEPSEEK_MODELS } from '../constants';

const DEFAULT_BASE_URL = 'https://api.deepseek.com';
const DEFAULT_MODEL = DEEPSEEK_MODELS.V4_PRO;

/**
 * Native DeepSeek provider via @ai-sdk/openai-compatible.
 *
 * DeepSeek's API is OpenAI-compatible (POST /v1/chat/completions), so we
 * reuse the same `createOpenAICompatible` factory as OpenRouterProvider.
 * The key differences:
 *
 * - Default base URL is https://api.deepseek.com (not OpenRouter).
 * - Models: deepseek-v4-pro (flagship, 1M context, reasoning) and
 *   deepseek-v4-flash (fast, 1M context).
 * - Thinking mode: `thinking: {type: "enabled"}` and `reasoning_effort`
 *   are injected as extra_body fields when configured.
 * - Embedding support: DeepSeek does not currently offer a public embedding
 *   model. When no embedding model is configured, `getEmbeddingModel()`
 *   throws with a descriptive message so the orchestrator can fall back.
 *
 * ⚠️ deepseek-chat and deepseek-reasoner will be deprecated 2026-07-24.
 */
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
    if (!settings.deepseekApiKey) {
      throw new Error('DeepSeek API key required');
    }
    this.apiKey = settings.deepseekApiKey;
    this.baseUrl = (settings.deepseekBaseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.httpFetch = getAIFetch();

    // Build headers with thinking mode if enabled.
    const extraHeaders: Record<string, string> = {
      'HTTP-Referer': 'https://risale-ai-studio.com',
      'X-Title': 'Risale AI Studio',
    };

    this.client = createOpenAICompatible({
      name: 'deepseek',
      baseURL: this.baseUrl,
      apiKey: this.apiKey,
      headers: extraHeaders,
      fetch: this.httpFetch,
    });
    aiLogger.provider.init('deepseek', settings.deepseekModel || DEFAULT_MODEL);
  }

  getModel(): LanguageModel {
    const modelId = this.settings.deepseekModel || DEFAULT_MODEL;
    return this.client.chatModel(modelId);
  }

  getEmbeddingModel(): EmbeddingModel {
    // DeepSeek does not currently offer a public embedding model.
    // If the user configured an OpenAI-compatible embedding through
    // the deepseekEmbeddingModel field, use it via the same client.
    if (this.settings.deepseekEmbeddingModel) {
      return this.client.textEmbeddingModel(this.settings.deepseekEmbeddingModel);
    }
    throw new Error(
      'DeepSeek does not provide embedding models. Configure an embedding model in settings or use a different provider for embeddings.',
    );
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async healthCheck(): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      const modelId = this.settings.deepseekModel || DEFAULT_MODEL;
      aiLogger.provider.init('deepseek', `healthCheck starting with model: ${modelId}`);

      const response = await this.httpFetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${this.apiKey}` },
        signal: AbortSignal.timeout(AI_TIMEOUTS.HEALTH_CHECK),
      });
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      aiLogger.provider.init('deepseek', 'healthCheck success');
      return true;
    } catch (e) {
      aiLogger.provider.error('deepseek', `healthCheck failed: ${(e as Error).message}`);
      return false;
    }
  }
}

/**
 * Fetch the list of models from the DeepSeek API.
 * Used by the settings UI to populate the model picker.
 */
export async function fetchDeepSeekModels(
  baseUrl: string,
  apiKey: string,
  signal?: AbortSignal,
): Promise<Array<{ id: string }>> {
  const trimmed = (baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
  const url = `${trimmed}/models`;
  const httpFetch = getAIFetch();
  const response = await httpFetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiKey}` },
    signal,
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.status}`);
  }
  const json = (await response.json()) as { data?: Array<{ id: string }> };
  return Array.isArray(json.data) ? json.data : [];
}
