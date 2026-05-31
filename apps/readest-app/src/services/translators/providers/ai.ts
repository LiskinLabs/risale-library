import { generateText } from 'ai';
import { stubTranslation as _ } from '@/utils/misc';
import { normalizeToFullLang } from '@/utils/lang';
import { TranslationProvider } from '../types';
import { useSettingsStore } from '@/store/settingsStore';
import { getAIProvider } from '@/services/ai/providers';
import type { AISettings } from '@/services/ai/types';

/** Generic AI translator — uses whichever AI provider is currently configured. Works with all providers. */
export const aiProvider: TranslationProvider = {
  name: 'ai',
  label: _('AI (Auto)'),
  authRequired: false,

  translate: async (text: string[], sourceLang: string, targetLang: string): Promise<string[]> => {
    if (!text.length) return [];
    const { settings } = useSettingsStore.getState();
    const aiSettings: AISettings | undefined = settings?.aiSettings;
    if (!aiSettings?.enabled) throw new Error('AI Assistant is disabled. Enable it in Settings → AI first.');

    let provider;
    try { provider = getAIProvider(aiSettings); }
    catch (e) { throw new Error(`AI provider "${aiSettings.provider}" not configured. ${(e as Error).message}`); }

    const model = provider.getModel();
    const fullSourceLang = sourceLang && sourceLang.toLowerCase() !== 'auto' ? normalizeToFullLang(sourceLang) : 'auto-detect';
    const fullTargetLang = normalizeToFullLang(targetLang);
    const results: string[] = new Array(text.length).fill('');

    const jobs = text.map(async (line, i) => {
      if (!line?.trim().length) { results[i] = line; return; }
      try {
        const { text: translated } = await generateText({
          model,
          prompt: `Translate the following text from ${fullSourceLang} to ${fullTargetLang}.\nReturn ONLY the translated text, no explanations.\nSource text:\n${line}`,
          temperature: 0.1,
          maxOutputTokens: 2048,
        });
        results[i] = translated?.trim() || line;
      } catch (e) { console.error(`[AI Translator] line ${i}:`, e); results[i] = line; }
    });
    await Promise.all(jobs);
    return results;
  },
};
