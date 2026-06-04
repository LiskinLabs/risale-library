import { validateUserAndToken } from '@/utils/access';
import { generateText, createGateway } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

// ── Model resolution ───────────────────────────────────────────────────

interface ModelConfig {
  provider: 'gateway' | 'gemini' | 'deepseek';
  model: ReturnType<ReturnType<typeof createGateway>>; // LanguageModel
}

function resolveModel(body: Record<string, unknown>): ModelConfig | { error: string } {
  // 1. AI Gateway (env var) — explicit server-wide key
  const gatewayKey = process.env['AI_GATEWAY_API_KEY'];
  if (gatewayKey) {
    const gateway = createGateway({ apiKey: gatewayKey });
    const modelName =
      (body['gatewayModel'] as string) ||
      process.env['AI_GATEWAY_MODEL'] ||
      'google/gemini-2.5-flash-lite';
    return { provider: 'gateway', model: gateway(modelName) };
  }

  // 2. Gemini API key (user setting → env var fallback)
  const geminiKey = (body['geminiApiKey'] as string | undefined) || process.env['GEMINI_API_KEY'];
  if (geminiKey) {
    const google = createGoogleGenerativeAI({ apiKey: geminiKey });
    const modelName = (body['geminiModel'] as string) || 'gemini-2.5-flash-lite';
    return { provider: 'gemini', model: google(modelName) };
  }

  // 3. DeepSeek API key (user setting → env var fallback)
  const deepseekKey =
    (body['deepseekApiKey'] as string | undefined) || process.env['DEEPSEEK_API_KEY'];
  if (deepseekKey) {
    const client = createOpenAICompatible({
      name: 'deepseek',
      baseURL: 'https://api.deepseek.com',
      apiKey: deepseekKey,
    });
    const modelName = (body['deepseekModel'] as string) || 'deepseek-v4-pro';
    return { provider: 'deepseek', model: client(modelName) };
  }

  return {
    error:
      'No AI provider configured. Set DEEPSEEK_API_KEY, GEMINI_API_KEY, or AI_GATEWAY_API_KEY in .env.local, or configure in Settings → AI.',
  };
}

// ── Handlers ───────────────────────────────────────────────────────────

async function simpleDefinition(
  word: string,
  targetLang: string,
  model: ModelConfig['model'],
): Promise<string> {
  const langNames: Record<string, string> = {
    ru: 'русском',
    tr: 'Türkçe',
    en: 'English',
    ar: 'العربية',
  };
  const tl = langNames[targetLang] || targetLang;
  const result = await generateText({
    model,
    system: `You are an Islamic theological dictionary specializing in Risale-i Nur terminology. Give a concise 1-2 sentence definition in ${tl}. Include both the literal meaning and the theological significance. No formatting, no greetings — just the definition.`,
    prompt: word,
    maxOutputTokens: 200,
    temperature: 0.3,
    abortSignal: AbortSignal.timeout(15000),
  });
  return result.text?.trim() || word;
}

async function fullDefinition(
  word: string,
  targetLang: string,
  sourceLang: string,
  model: ModelConfig['model'],
): Promise<string> {
  const langNames: Record<string, string> = {
    ru: 'русский',
    tr: 'Türkçe',
    en: 'English',
    ar: 'العربية',
    fa: 'فارسی',
    uz: 'Oʻzbekcha',
    kk: 'Қазақша',
    az: 'Azərbaycanca',
    de: 'Deutsch',
    fr: 'Français',
    es: 'Español',
  };
  const sl = langNames[sourceLang] || sourceLang;

  const systemPrompts: Record<string, string> = {
    ru: `Ты — словарь исламских терминов Рисале-и Нур.
Оригинал: ${sl}. Отвечай на: русском.

СТРОГО JSON (без markdown-блоков):
{
  "headword": "слово",
  "meaning": "2-3 предложения: буквальное значение + терминология Рисале-и Нур + коранический контекст",
  "arabic_equivalent": "арабский или null",
  "ottoman_equivalent": "османский или null",
  "grammatical_notes": "грамматика или null",
  "usage_level": "basic|intermediate|advanced",
  "passages": [],
  "sourceSummary": "Risale Lugat + TDK + Sesli Sözlük"
}
Для важных терминов (iman, tevhid, haşir, ubudiyet, etc.) добавь 1-2 passages. Для обычных — пустой массив.`,
    en: `You are a Risale-i Nur Islamic terminology dictionary.
Source language: ${sl}. Respond in: English.

STRICT JSON only (no markdown blocks):
{
  "headword": "word",
  "meaning": "2-3 sentences: literal meaning + Risale-i Nur terminology + Quranic context",
  "arabic_equivalent": "Arabic or null",
  "ottoman_equivalent": "Ottoman or null",
  "grammatical_notes": "grammar or null",
  "usage_level": "basic|intermediate|advanced",
  "passages": [],
  "sourceSummary": "Risale Lugat + TDK + Sesli Sözlük"
}
For important theological terms, add 1-2 passages from Risale books. For common words, empty passages array.`,
    tr: `Sen Risale-i Nur İslami terminoloji sözlüğüsün.
Kaynak dil: ${sl}. Cevap dili: Türkçe.

SADECE JSON (markdown bloğu olmadan):
{
  "headword": "kelime",
  "meaning": "2-3 cümle: kelime anlamı + Risale-i Nur terminolojisi + Kur'ani bağlam",
  "arabic_equivalent": "Arapçası veya null",
  "ottoman_equivalent": "Osmanlıcası veya null",
  "grammatical_notes": "gramer veya null",
  "usage_level": "basic|intermediate|advanced",
  "passages": [],
  "sourceSummary": "Risale Lugat + TDK + Sesli Sözlük"
}
Önemli terimler için Risale kitaplarından 1-2 passages ekle. Basit kelimeler için boş passages.`,
  };
  const system = systemPrompts[targetLang] ?? systemPrompts['en']!;

  const result = await generateText({
    model,
    system,
    prompt: word,
    maxOutputTokens: 900,
    temperature: 0.5,
    abortSignal: AbortSignal.timeout(25000),
  });

  return result.text?.trim() || '';
}

// ── Route handler ──────────────────────────────────────────────────────

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { word, targetLang, sourceLang, complexity = 'complex' } = body;

    // Health check mode — verify API key works.
    // Only tests with a fixed word ("hello") to prevent abuse.
    // No app auth needed because the API key itself acts as the secret.
    if (complexity === 'health') {
      const resolved = resolveModel(body);
      if ('error' in resolved) {
        return Response.json({ ok: false, error: resolved.error });
      }
      // Always use a fixed test word — client cannot override
      const def = await simpleDefinition('hello', targetLang || 'en', resolved.model);
      return Response.json({ ok: true, definition: def });
    }

    // Auth: skip app auth ONLY when the user provides their OWN API key in the request.
    // Keys from server env vars (DEEPSEEK_API_KEY / GEMINI_API_KEY) are server resources
    // and REQUIRE authentication to prevent unauthorized usage/quota theft.
    const userProvidedKey = !!(body['geminiApiKey'] || body['deepseekApiKey']);
    if (!userProvidedKey) {
      const { user, token } = await validateUserAndToken(req.headers.get('authorization'));
      if (!user || !token) {
        return Response.json({ error: 'Not authenticated' }, { status: 403 });
      }
    }

    if (!word) {
      return Response.json({ error: 'Word required' }, { status: 400 });
    }

    const resolved = resolveModel(body);
    if ('error' in resolved) {
      return Response.json({ error: resolved.error }, { status: 400 });
    }

    if (complexity === 'simple') {
      const definition = await simpleDefinition(word, targetLang || 'ru', resolved.model);
      return Response.json({ ok: true, definition, headword: word });
    }

    let jsonText = await fullDefinition(
      word,
      targetLang || 'ru',
      sourceLang || 'tr',
      resolved.model,
    );
    // Strip markdown code blocks that some models wrap JSON in
    jsonText = jsonText.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }
    return Response.json({ ok: true, json: jsonText, headword: word });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: `Dictionary lookup failed: ${errorMessage}` }, { status: 500 });
  }
}
