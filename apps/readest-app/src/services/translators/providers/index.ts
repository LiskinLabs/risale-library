import { useSettingsStore } from '@/store/settingsStore';
import { TranslationProvider } from '../types';
import { deeplProvider } from './deepl';
import { azureProvider } from './azure';
import { googleProvider } from './google';
import { yandexProvider } from './yandex';
import { geminiProvider } from './gemini';
import { aiProvider } from './ai';

function createTranslator<T extends string>(
  name: T,
  implementation: TranslationProvider,
): TranslationProvider & { name: T } {
  if (name !== implementation.name) throw Error(`Translator name "${name}" does not match implementation name "${implementation.name}"`);
  return implementation as TranslationProvider & { name: T };
}

const deeplTranslator = createTranslator('deepl', deeplProvider);
const azureTranslator = createTranslator('azure', azureProvider);
const googleTranslator = createTranslator('google', googleProvider);
const yandexTranslator = createTranslator('yandex', yandexProvider);
const geminiTranslator = createTranslator('gemini', geminiProvider);
const aiTranslator = createTranslator('ai', aiProvider);

const availableTranslators = [deeplTranslator, azureTranslator, googleTranslator, yandexTranslator, geminiTranslator, aiTranslator];

export type TranslatorName = (typeof availableTranslators)[number]['name'];
export const getTranslator = (name: TranslatorName): TranslationProvider | undefined => availableTranslators.find((t) => t.name === name);
export const getTranslators = (): TranslationProvider[] => availableTranslators;

function isAiProviderConfigured(): boolean {
  const { settings } = useSettingsStore.getState();
  const ai = settings?.aiSettings;
  if (!ai?.enabled) return false;
  switch (ai.provider) {
    case 'ollama': return true;
    case 'ai-gateway': return !!(ai.aiGatewayApiKey || process.env['AI_GATEWAY_API_KEY']);
    case 'openrouter': return !!(ai.openrouterApiKey || process.env['OPENROUTER_API_KEY']);
    case 'gemini': return !!(ai.geminiApiKey || process.env['GEMINI_API_KEY']);
    case 'deepseek': return !!(ai.deepseekApiKey || process.env['DEEPSEEK_API_KEY']);
    default: return false;
  }
}

export const isTranslatorAvailable = (translator: TranslationProvider, hasToken: boolean): boolean => {
  if (translator.disabled || translator.quotaExceeded) return false;
  if (translator.authRequired && !hasToken) return false;
  if (translator.name === 'gemini') { const { settings } = useSettingsStore.getState(); if (!settings.aiSettings?.geminiApiKey) return false; }
  if (translator.name === 'ai') { if (!isAiProviderConfigured()) return false; }
  return true;
};

export const getTranslatorDisplayLabel = (translator: TranslationProvider, hasToken: boolean, _: (key: string) => string): string => {
  if (translator.disabled) return `${translator.label} (${_('Unavailable')})`;
  if (translator.authRequired && !hasToken) return `${translator.label} (${_('Login Required')})`;
  if (translator.quotaExceeded) return `${translator.label} (${_('Quota Exceeded')})`;
  if (translator.name === 'gemini') { const { settings } = useSettingsStore.getState(); if (!settings.aiSettings?.geminiApiKey) return `${translator.label} (${_('API Key Required')})`; }
  if (translator.name === 'ai') { if (!isAiProviderConfigured()) { const { settings } = useSettingsStore.getState(); const p = settings?.aiSettings?.provider ?? 'ollama'; return `${translator.label} [${p}] (${_('API Key Required')})`; } }
  return translator.label;
};
