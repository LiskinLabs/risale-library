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
  // 1. AI Gateway (env var)
  const gatewayKey = process.env['AI_GATEWAY_API_KEY'];
  if (gatewayKey) {
    const gateway = createGateway({ apiKey: gatewayKey });
    const modelName =
      (body['gatewayModel'] as string) ||
      process.env['AI_GATEWAY_MODEL'] ||
      'google/gemini-2.5-flash-lite';
    return { provider: 'gateway', model: gateway(modelName) };
  }

  // 2. Direct Gemini API key (from user settings)
  const geminiKey = body['geminiApiKey'] as string | undefined;
  if (geminiKey) {
    const google = createGoogleGenerativeAI({ apiKey: geminiKey });
    const modelName = (body['geminiModel'] as string) || 'gemini-2.5-flash-lite';
    return { provider: 'gemini', model: google(modelName) };
  }

  // 3. Direct DeepSeek API key (from user settings)
  const deepseekKey = body['deepseekApiKey'] as string | undefined;
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
    error: 'No AI provider configured. Set AI_GATEWAY_API_KEY, geminiApiKey, or deepseekApiKey.',
  };
}

// ── Handlers ───────────────────────────────────────────────────────────

async function simpleDefinition(
  word: string,
  targetLang: string,
  model: ModelConfig['model'],
): Promise<string> {
  const result = await generateText({
    model,
    system: `You are a dictionary. Give a SHORT, 1-paragraph definition of the word in "${targetLang}". Only the meaning, no formatting.`,
    prompt: word,
    maxOutputTokens: 150,
    temperature: 0.3,
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
  const tl = langNames[targetLang] || targetLang;
  const sl = langNames[sourceLang] || sourceLang;

  const result = await generateText({
    model,
    system: `Ты — исламский теологический словарь Risale-i Nur (Рисале-и Нур). Дай ПОЛНОЕ определение слова.

Язык оригинала: ${sl}
Язык ответа: ${tl}

ОТВЕТЬ СТРОГО В JSON:
{
  "headword": "оригинальное слово",
  "meaning": "ПОЛНОЕ толкование на ${tl}: (1) буквальное значение, (2) терминологическое значение в Рисале-и Нур, (3) коранический контекст. 2-3 предложения.",
  "arabic_equivalent": "арабский эквивалент или null",
  "ottoman_equivalent": "османский вариант или null",
  "grammatical_notes": "часть речи, падеж, происхождение или null",
  "usage_level": "basic | intermediate | advanced",
  "passages": [
    {
      "bookName": "Название книги на ${tl}",
      "chapterName": "Название главы или null",
      "sentence": "Оригинальное предложение из Рисале-и Нур на ${sl}",
      "sentenceTranslation": "Перевод этого предложения на ${tl}",
      "wordInContext": "Как слово используется в этом контексте, на ${tl}"
    }
  ],
  "sourceSummary": "Какие источники использованы"
}

Примеры книг: Sözler, Mektubat, Lem'alar, Şualar, İşaratü'l-İ'caz, Mesnevi-i Nuriye.
Для сложных терминов дай 1-2 примера из этих книг. Для простых слов — пустой passages.`,
    prompt: word,
    maxOutputTokens: 900,
    temperature: 0.5,
  });

  return result.text?.trim() || '';
}

// ── Route handler ──────────────────────────────────────────────────────

export async function POST(req: Request): Promise<Response> {
  try {
    const { user, token } = await validateUserAndToken(req.headers.get('authorization'));
    if (!user || !token) {
      return Response.json({ error: 'Not authenticated' }, { status: 403 });
    }

    const body = await req.json();
    const { word, targetLang, sourceLang, complexity = 'complex' } = body;

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

    const jsonText = await fullDefinition(
      word,
      targetLang || 'ru',
      sourceLang || 'tr',
      resolved.model,
    );
    return Response.json({ ok: true, json: jsonText, headword: word });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: `Dictionary lookup failed: ${errorMessage}` }, { status: 500 });
  }
}
