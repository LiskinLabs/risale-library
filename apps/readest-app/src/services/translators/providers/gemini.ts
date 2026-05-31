import { stubTranslation as _ } from '@/utils/misc';
import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { isTauriAppPlatform } from '@/services/environment';
import { normalizeToFullLang } from '@/utils/lang';
import { TranslationProvider } from '../types';
import { useSettingsStore } from '@/store/settingsStore';

export const geminiProvider: TranslationProvider = {
  name: 'gemini',
  label: _('Gemini AI'),
  translate: async (text: string[], sourceLang: string, targetLang: string): Promise<string[]> => {
    if (!text.length) return [];
    const { settings } = useSettingsStore.getState();
    const apiKey = settings.aiSettings?.geminiApiKey;
    const modelId = settings.aiSettings?.geminiModel || 'gemini-2.5-flash';
    if (!apiKey) throw new Error('Gemini API key is required. Please set it in Settings → AI.');

    const results: string[] = [];
    const fullSourceLang = sourceLang && sourceLang.toLowerCase() !== 'auto' ? normalizeToFullLang(sourceLang) : 'auto-detect';
    const fullTargetLang = normalizeToFullLang(targetLang);

    const jobs = text.map(async (line, index) => {
      if (!line?.trim().length) { results[index] = line; return; }
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`;
      const prompt = `Translate from ${fullSourceLang} to ${fullTargetLang}. Return ONLY the translated text, no explanations.\nSource text:\n${line}`;
      const fetchFn = isTauriAppPlatform() ? tauriFetch : window.fetch;
      const response = await fetchFn(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1, topP: 1, topK: 1, maxOutputTokens: 2048 } }),
      });
      if (!response.ok) { const err = await response.json().catch(() => ({})); throw new Error(err.error?.message || `Gemini error ${response.status}`); }
      const data = await response.json();
      results[index] = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || line;
    });
    await Promise.all(jobs);
    return results;
  },
};
