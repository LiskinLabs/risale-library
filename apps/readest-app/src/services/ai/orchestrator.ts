import type { LanguageModel, EmbeddingModel } from 'ai';
import { getAIProvider } from './providers';
import { aiLogger } from './logger';
import type { AIProvider, AISettings, AIProviderName } from './types';

/**
 * Default fallback chain: when the primary provider is unavailable, the
 * orchestrator tries each provider in order until one succeeds. Providers
 * earlier in the list are preferred for their respective strengths.
 *
 * Priority rationale:
 * 1. Gemini Flash — fast, cheap, huge context (2M). Best default.
 * 2. DeepSeek V4 — powerful reasoning, 1M context, good fallback.
 * 3. OpenRouter — gateway to 200+ models, including Claude/GPT.
 * 4. Ollama — local, free, no rate limits. Last resort for cloud outages.
 */
export const DEFAULT_FALLBACK_CHAIN: AIProviderName[] = [
  'gemini',
  'deepseek',
  'openrouter',
  'ai-gateway',
  'ollama',
];

/**
 * Task-based model routing hints. Different AI tasks benefit from different
 * model strengths. The orchestrator uses these to pick the best available
 * model for each task type.
 */
export type AITaskType =
  | 'chat' // conversational chat, Q&A about books
  | 'analysis' // deep analysis, summarization
  | 'embedding' // text embeddings for RAG
  | 'translation' // language translation
  | 'annotation' // generating annotations/haşiye
  | 'reasoning'; // complex multi-step reasoning

interface TaskRoutingHint {
  preferredProvider: AIProviderName;
  fallbackProviders: AIProviderName[];
  maxTokens?: number;
  temperature?: number;
}

const TASK_ROUTING: Record<AITaskType, TaskRoutingHint> = {
  chat: {
    preferredProvider: 'gemini',
    fallbackProviders: ['deepseek', 'openrouter', 'ai-gateway', 'ollama'],
    temperature: 0.7,
  },
  analysis: {
    preferredProvider: 'deepseek',
    fallbackProviders: ['gemini', 'openrouter', 'ai-gateway', 'ollama'],
    temperature: 0.3,
  },
  embedding: {
    preferredProvider: 'gemini',
    fallbackProviders: ['openrouter', 'ai-gateway', 'ollama'],
  },
  translation: {
    preferredProvider: 'deepseek',
    fallbackProviders: ['gemini', 'openrouter', 'ai-gateway', 'ollama'],
    temperature: 0.2,
  },
  annotation: {
    preferredProvider: 'gemini',
    fallbackProviders: ['deepseek', 'openrouter', 'ai-gateway', 'ollama'],
    temperature: 0.4,
  },
  reasoning: {
    preferredProvider: 'deepseek',
    fallbackProviders: ['gemini', 'openrouter', 'ai-gateway', 'ollama'],
    temperature: 0.3,
  },
};

// ---------------------------------------------------------------------------
// Simple in-memory response cache (TTL-based)
// ---------------------------------------------------------------------------

interface CacheEntry {
  response: string;
  expiresAt: number;
  provider: string;
}

const responseCache = new Map<string, CacheEntry>();
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function cacheKey(
  messages: Array<{ role: string; content: string }>,
  systemPrompt?: string,
): string {
  const normalized = messages.map((m) => `${m.role}:${m.content.slice(0, 500)}`).join('|');
  const prefix = systemPrompt ? systemPrompt.slice(0, 200) : '';
  return `${prefix}::${normalized}`;
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export interface OrchestratorOptions {
  settings: AISettings;
  taskType?: AITaskType;
  customFallbackChain?: AIProviderName[];
  cacheTTL?: number;
  onProviderSwitch?: (from: string, to: string, reason: string) => void;
}

export interface OrchestratorResult<T> {
  result: T;
  provider: AIProviderName;
  fallbackUsed: boolean;
  fallbackChain: string[];
}

/**
 * AI Orchestrator — the central coordinator for all AI provider access.
 *
 * Responsibilities:
 * 1. **Provider resolution** — picks the best provider for the task.
 * 2. **Fallback** — if the primary provider fails, automatically tries
 *    the next one in the chain until one succeeds.
 * 3. **Response caching** — caches identical requests to avoid redundant
 *    API calls (especially useful for embeddings).
 * 4. **Health-aware routing** — skips providers that are known to be
 *    unavailable (avoids wasting time on timeouts).
 */
export class AIOrchestrator {
  private settings: AISettings;
  private taskType: AITaskType;
  private fallbackChain: AIProviderName[];
  private cacheTTL: number;
  private onProviderSwitch?: (from: string, to: string, reason: string) => void;
  private unhealthyProviders = new Set<string>();

  constructor(options: OrchestratorOptions) {
    this.settings = options.settings;
    this.taskType = options.taskType || 'chat';
    this.cacheTTL = options.cacheTTL ?? DEFAULT_CACHE_TTL_MS;

    const routing = TASK_ROUTING[this.taskType];
    this.fallbackChain = options.customFallbackChain || [
      routing.preferredProvider,
      ...routing.fallbackProviders.filter((p) => p !== routing.preferredProvider),
    ];

    // If the user explicitly chose a provider, put it first.
    if (this.settings.provider && !options.customFallbackChain) {
      this.fallbackChain = [
        this.settings.provider,
        ...this.fallbackChain.filter((p) => p !== this.settings.provider),
      ];
    }

    // If fallback is disabled, only use the primary provider.
    if (!this.settings.fallbackEnabled) {
      this.fallbackChain = [this.fallbackChain[0]!];
    }

    this.onProviderSwitch = options.onProviderSwitch;
  }

  /**
   * Get a working AI provider, trying fallbacks if necessary.
   */
  async getWorkingProvider(): Promise<OrchestratorResult<AIProvider>> {
    const tried: string[] = [];
    let lastError: Error | null = null;

    for (const providerName of this.fallbackChain) {
      // Skip providers known to be unhealthy (reset after 60s)
      if (this.unhealthyProviders.has(providerName)) {
        tried.push(`${providerName}(unhealthy)`);
        continue;
      }

      try {
        const testSettings = this.buildSettingsForProvider(providerName);
        const provider = getAIProvider(testSettings);

        // Quick availability check (does NOT make a network call —
        // just checks if required credentials are present).
        const available = await provider.isAvailable();
        if (!available) {
          tried.push(`${providerName}(no-credentials)`);
          continue;
        }

        if (tried.length > 0 && this.onProviderSwitch) {
          const previous = tried[tried.length - 1]!.split('(')[0]!;
          this.onProviderSwitch(
            previous,
            providerName,
            tried.length === 1 ? 'primary unavailable' : 'fallback chain',
          );
        }

        aiLogger.provider.init(providerName, `resolved via orchestrator (task: ${this.taskType})`);
        return {
          result: provider,
          provider: providerName as AIProviderName,
          fallbackUsed: tried.length > 0,
          fallbackChain: tried,
        };
      } catch (e) {
        lastError = e as Error;
        tried.push(`${providerName}(${(e as Error).message.slice(0, 40)})`);
        this.unhealthyProviders.add(providerName);
        // Auto-clear unhealthy flag after 60 seconds
        setTimeout(() => this.unhealthyProviders.delete(providerName), 60_000);
        aiLogger.provider.error(providerName, `orchestrator skip: ${(e as Error).message}`);
      }
    }

    throw new Error(
      `No AI provider available. Tried: ${tried.join(' → ')}. Last error: ${lastError?.message}`,
    );
  }

  /**
   * Get a language model for the current task, with fallback.
   */
  async getModel(): Promise<OrchestratorResult<LanguageModel>> {
    const { result: provider, ...meta } = await this.getWorkingProvider();
    return { result: provider.getModel(), ...meta };
  }

  /**
   * Get an embedding model, with fallback.
   */
  async getEmbeddingModel(): Promise<OrchestratorResult<EmbeddingModel>> {
    // For embeddings, try each provider in the fallback chain until one
    // returns a working embedding model.
    const tried: string[] = [];
    let lastError: Error | null = null;

    for (const providerName of this.fallbackChain) {
      if (this.unhealthyProviders.has(providerName)) {
        tried.push(`${providerName}(unhealthy)`);
        continue;
      }

      try {
        const testSettings = this.buildSettingsForProvider(providerName);
        const provider = getAIProvider(testSettings);

        const available = await provider.isAvailable();
        if (!available) {
          tried.push(`${providerName}(no-credentials)`);
          continue;
        }

        const embeddingModel = provider.getEmbeddingModel();
        return {
          result: embeddingModel,
          provider: providerName as AIProviderName,
          fallbackUsed: tried.length > 0,
          fallbackChain: tried,
        };
      } catch (e) {
        lastError = e as Error;
        // Embedding not supported by this provider (e.g., DeepSeek)
        tried.push(`${providerName}(no-embeddings)`);
      }
    }

    // Last resort: if fallback is enabled and primary provider failed for
    // embeddings, try to use any provider that supports them.
    if (this.settings.fallbackEnabled && this.fallbackChain.length > 1) {
      // We've already tried all providers. At this point just throw.
    }

    throw new Error(
      `No embedding provider available. Tried: ${tried.join(' → ')}. Last error: ${lastError?.message}`,
    );
  }

  /**
   * Get the task routing configuration.
   */
  getTaskRouting(): TaskRoutingHint {
    return TASK_ROUTING[this.taskType];
  }

  /**
   * Cache a response for a given set of messages.
   */
  cacheResponse(
    messages: Array<{ role: string; content: string }>,
    response: string,
    systemPrompt?: string,
    provider?: string,
  ): void {
    const key = cacheKey(messages, systemPrompt);
    responseCache.set(key, {
      response,
      expiresAt: Date.now() + this.cacheTTL,
      provider: provider || 'unknown',
    });
  }

  /**
   * Look up a cached response. Returns null if not found or expired.
   */
  getCachedResponse(
    messages: Array<{ role: string; content: string }>,
    systemPrompt?: string,
  ): string | null {
    const key = cacheKey(messages, systemPrompt);
    const entry = responseCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      responseCache.delete(key);
      return null;
    }
    return entry.response;
  }

  /**
   * Clear the response cache (useful when switching books or settings).
   */
  clearCache(): void {
    responseCache.clear();
  }

  /**
   * Reset unhealthy provider list (e.g., after network comes back).
   */
  resetUnhealthyProviders(): void {
    this.unhealthyProviders.clear();
  }

  /**
   * Build a temporary AISettings object targeting a specific provider.
   * Necessary because getAIProvider expects settings with the correct
   * provider field and credentials.
   */
  private buildSettingsForProvider(providerName: string): AISettings {
    // Start with current settings and override the provider field.
    // Credentials for each provider are already stored in the settings.
    return {
      ...this.settings,
      provider: providerName as AIProviderName,
    };
  }
}

// ---------------------------------------------------------------------------
// Singleton convenience
// ---------------------------------------------------------------------------

let defaultOrchestrator: AIOrchestrator | null = null;

export function getOrchestrator(settings: AISettings, taskType?: AITaskType): AIOrchestrator {
  // Always return a fresh orchestrator per call to respect current settings.
  // The lightweight constructor makes this cheap.
  return new AIOrchestrator({ settings, taskType });
}

export function getOrCreateDefaultOrchestrator(settings: AISettings): AIOrchestrator {
  if (!defaultOrchestrator) {
    defaultOrchestrator = new AIOrchestrator({ settings });
  }
  return defaultOrchestrator;
}

export function clearDefaultOrchestrator(): void {
  defaultOrchestrator?.clearCache();
  defaultOrchestrator = null;
}
