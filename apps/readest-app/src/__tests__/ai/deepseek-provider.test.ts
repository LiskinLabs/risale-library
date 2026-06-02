import { describe, test, expect, vi, beforeEach } from 'vitest';

// mock @ai-sdk/openai-compatible
vi.mock('@ai-sdk/openai-compatible', () => ({
  createOpenAICompatible: vi.fn(() => ({
    chatModel: vi.fn(),
    textEmbeddingModel: vi.fn(),
  })),
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

import { DeepSeekProvider } from '@/services/ai/providers/DeepSeekProvider';
import type { AISettings } from '@/services/ai/types';
import { DEFAULT_AI_SETTINGS } from '@/services/ai/constants';

describe('DeepSeekProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should throw if no API key', () => {
    const settings: AISettings = { ...DEFAULT_AI_SETTINGS, enabled: true, provider: 'deepseek' };
    expect(() => new DeepSeekProvider(settings)).toThrow('DeepSeek API key required');
  });

  test('should create provider with API key', () => {
    const settings: AISettings = {
      ...DEFAULT_AI_SETTINGS,
      enabled: true,
      provider: 'deepseek',
      deepseekApiKey: 'sk-test',
    };
    const provider = new DeepSeekProvider(settings);

    expect(provider.id).toBe('deepseek');
    expect(provider.name).toBe('DeepSeek');
    expect(provider.requiresAuth).toBe(true);
  });

  test('isAvailable should return true if key exists', async () => {
    const settings: AISettings = {
      ...DEFAULT_AI_SETTINGS,
      enabled: true,
      provider: 'deepseek',
      deepseekApiKey: 'sk-test',
    };
    const provider = new DeepSeekProvider(settings);

    expect(await provider.isAvailable()).toBe(true);
  });

  test('getEmbeddingModel throws without embedding model configured', () => {
    const settings: AISettings = {
      ...DEFAULT_AI_SETTINGS,
      enabled: true,
      provider: 'deepseek',
      deepseekApiKey: 'sk-test',
    };
    const provider = new DeepSeekProvider(settings);

    expect(() => provider.getEmbeddingModel()).toThrow(
      'DeepSeek does not provide embedding models',
    );
  });

  test('getEmbeddingModel works with configured embedding model', () => {
    const settings: AISettings = {
      ...DEFAULT_AI_SETTINGS,
      enabled: true,
      provider: 'deepseek',
      deepseekApiKey: 'sk-test',
      deepseekEmbeddingModel: 'text-embedding-3-small',
    };
    const provider = new DeepSeekProvider(settings);

    provider.getEmbeddingModel();
  });

  test('uses custom base URL if specified', () => {
    const settings: AISettings = {
      ...DEFAULT_AI_SETTINGS,
      enabled: true,
      provider: 'deepseek',
      deepseekApiKey: 'sk-test',
      deepseekBaseUrl: 'https://custom-deepseek.example.com',
    };
    const provider = new DeepSeekProvider(settings);

    expect(provider.id).toBe('deepseek');
  });
});
