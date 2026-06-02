import { describe, test, expect, vi, beforeEach } from 'vitest';

// mock @ai-sdk/google
vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: vi.fn(() => {
    const googleFn = Object.assign(vi.fn(), {
      textEmbeddingModel: vi.fn(),
    });
    return googleFn;
  }),
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

import { GeminiProvider } from '@/services/ai/providers/GeminiProvider';
import type { AISettings } from '@/services/ai/types';
import { DEFAULT_AI_SETTINGS } from '@/services/ai/constants';

describe('GeminiProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should throw if no API key', () => {
    const settings: AISettings = { ...DEFAULT_AI_SETTINGS, enabled: true, provider: 'gemini' };
    expect(() => new GeminiProvider(settings)).toThrow('Gemini API key required');
  });

  test('should create provider with API key', () => {
    const settings: AISettings = {
      ...DEFAULT_AI_SETTINGS,
      enabled: true,
      provider: 'gemini',
      geminiApiKey: 'test-key',
    };
    const provider = new GeminiProvider(settings);

    expect(provider.id).toBe('gemini');
    expect(provider.name).toBe('Google Gemini');
    expect(provider.requiresAuth).toBe(true);
  });

  test('isAvailable should return true if key exists', async () => {
    const settings: AISettings = {
      ...DEFAULT_AI_SETTINGS,
      enabled: true,
      provider: 'gemini',
      geminiApiKey: 'test-key',
    };
    const provider = new GeminiProvider(settings);

    expect(await provider.isAvailable()).toBe(true);
  });

  test('uses default model if not specified', () => {
    const settings: AISettings = {
      ...DEFAULT_AI_SETTINGS,
      enabled: true,
      provider: 'gemini',
      geminiApiKey: 'test-key',
    };
    const provider = new GeminiProvider(settings);

    // getModel should not throw
    provider.getModel();
  });

  test('uses custom model if specified', () => {
    const settings: AISettings = {
      ...DEFAULT_AI_SETTINGS,
      enabled: true,
      provider: 'gemini',
      geminiApiKey: 'test-key',
      geminiModel: 'gemini-2.5-flash',
    };
    const provider = new GeminiProvider(settings);

    provider.getModel();
  });

  test('getEmbeddingModel returns an embedding model', () => {
    const settings: AISettings = {
      ...DEFAULT_AI_SETTINGS,
      enabled: true,
      provider: 'gemini',
      geminiApiKey: 'test-key',
    };
    const provider = new GeminiProvider(settings);

    provider.getEmbeddingModel();
  });
});
