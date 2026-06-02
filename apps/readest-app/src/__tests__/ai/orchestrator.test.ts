import { describe, test, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted to ensure mock factories are available before hoisted vi.mock calls
const mocks = vi.hoisted(() => ({
  makeMockProvider: (id: string) => ({
    id,
    name: id,
    requiresAuth: true,
    getModel: vi.fn(() => ({})),
    getEmbeddingModel: vi.fn(() => ({})),
    isAvailable: vi.fn().mockResolvedValue(true),
    healthCheck: vi.fn().mockResolvedValue(true),
  }),
}));

// mock provider classes — factory functions must use vi.hoisted values
vi.mock('@/services/ai/providers/OllamaProvider', () => ({
  OllamaProvider: vi.fn().mockImplementation(() => mocks.makeMockProvider('ollama')),
}));
vi.mock('@/services/ai/providers/AIGatewayProvider', () => ({
  AIGatewayProvider: vi.fn().mockImplementation(() => mocks.makeMockProvider('ai-gateway')),
}));
vi.mock('@/services/ai/providers/OpenRouterProvider', () => ({
  OpenRouterProvider: vi.fn().mockImplementation(() => mocks.makeMockProvider('openrouter')),
}));
vi.mock('@/services/ai/providers/GeminiProvider', () => ({
  GeminiProvider: vi.fn().mockImplementation(() => mocks.makeMockProvider('gemini')),
}));
vi.mock('@/services/ai/providers/DeepSeekProvider', () => ({
  DeepSeekProvider: vi.fn().mockImplementation(() => mocks.makeMockProvider('deepseek')),
}));

// mock logger
vi.mock('@/services/ai/logger', () => ({
  aiLogger: {
    provider: {
      init: vi.fn(),
      error: vi.fn(),
    },
  },
}));

import {
  AIOrchestrator,
  getOrchestrator,
  DEFAULT_FALLBACK_CHAIN,
} from '@/services/ai/orchestrator';
import type { AISettings } from '@/services/ai/types';
import { DEFAULT_AI_SETTINGS } from '@/services/ai/constants';

describe('AIOrchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should create orchestrator with default settings', () => {
    const settings: AISettings = { ...DEFAULT_AI_SETTINGS, enabled: true };
    const orchestrator = new AIOrchestrator({ settings });
    expect(orchestrator).toBeDefined();
  });

  test('should create with fallback disabled', () => {
    const settings: AISettings = {
      ...DEFAULT_AI_SETTINGS,
      enabled: true,
      provider: 'gemini',
      geminiApiKey: 'test-key',
      fallbackEnabled: false,
    };
    const orchestrator = new AIOrchestrator({ settings });
    expect(orchestrator).toBeDefined();
  });

  test('getOrchestrator creates a new instance', () => {
    const settings: AISettings = { ...DEFAULT_AI_SETTINGS, enabled: true };
    const orch = getOrchestrator(settings, 'chat');
    expect(orch).toBeInstanceOf(AIOrchestrator);
  });

  test('should cache and retrieve responses', () => {
    const settings: AISettings = { ...DEFAULT_AI_SETTINGS, enabled: true };
    const orchestrator = new AIOrchestrator({ settings });

    const messages = [{ role: 'user' as const, content: 'test query' }];
    orchestrator.cacheResponse(messages, 'cached response', undefined, 'gemini');

    const cached = orchestrator.getCachedResponse(messages);
    expect(cached).toBe('cached response');
  });

  test('should return null for non-cached response', () => {
    const settings: AISettings = { ...DEFAULT_AI_SETTINGS, enabled: true };
    const orchestrator = new AIOrchestrator({ settings });

    const cached = orchestrator.getCachedResponse([{ role: 'user' as const, content: 'uncached' }]);
    expect(cached).toBeNull();
  });

  test('should clear cache', () => {
    const settings: AISettings = { ...DEFAULT_AI_SETTINGS, enabled: true };
    const orchestrator = new AIOrchestrator({ settings });

    const messages = [{ role: 'user' as const, content: 'test' }];
    orchestrator.cacheResponse(messages, 'response');
    orchestrator.clearCache();

    expect(orchestrator.getCachedResponse(messages)).toBeNull();
  });

  test('DEFAULT_FALLBACK_CHAIN has expected providers', () => {
    expect(DEFAULT_FALLBACK_CHAIN).toContain('gemini');
    expect(DEFAULT_FALLBACK_CHAIN).toContain('deepseek');
    expect(DEFAULT_FALLBACK_CHAIN).toContain('openrouter');
    expect(DEFAULT_FALLBACK_CHAIN).toContain('ollama');
  });

  test('should reset unhealthy providers', () => {
    const settings: AISettings = { ...DEFAULT_AI_SETTINGS, enabled: true };
    const orchestrator = new AIOrchestrator({ settings });
    orchestrator.resetUnhealthyProviders();
  });
});
