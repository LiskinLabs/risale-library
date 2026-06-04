import { validateUserAndToken } from '@/utils/access';
import { generateText, createGateway } from 'ai';

const GATEWAY_MODEL = process.env['AI_GATEWAY_MODEL'] || 'google/gemini-2.5-flash-lite';

// Simple words get a fast, short response (no JSON parsing needed)
async function simpleDefinition(word: string, targetLang: string): Promise<string> {
  const gatewayApiKey = process.env['AI_GATEWAY_API_KEY'];
  if (!gatewayApiKey) throw new Error('AI Gateway not configured');

  const gateway = createGateway({ apiKey: gatewayApiKey });
  const model = gateway(GATEWAY_MODEL);

  const result = await generateText({
    model,
    system: `You are a dictionary. Give a SHORT, 1-paragraph definition of the word in "${targetLang}". Only the meaning, no formatting.`,
    prompt: word,
    maxOutputTokens: 150,
    temperature: 0.3,
  });

  return result.text?.trim() || word;
}

// Complex words get a full JSON-structured response with Risale passages
async function fullDefinition(
  word: string,
  targetLang: string,
  sourceLang: string,
): Promise<string> {
  const gatewayApiKey = process.env['AI_GATEWAY_API_KEY'];
  if (!gatewayApiKey) throw new Error('AI Gateway not configured');

  const gateway = createGateway({ apiKey: gatewayApiKey });
  const model = gateway(GATEWAY_MODEL);

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
Для сложных терминов дай 1-2 реалистичных примера из этих книг. Для простых слов — пустой passages.`,
    prompt: word,
    maxOutputTokens: 900,
    temperature: 0.5,
  });

  return result.text?.trim() || '';
}

export async function POST(req: Request): Promise<Response> {
  try {
    const { user, token } = await validateUserAndToken(req.headers.get('authorization'));
    if (!user || !token) {
      return Response.json({ error: 'Not authenticated' }, { status: 403 });
    }

    const { word, targetLang, sourceLang, complexity = 'complex' } = await req.json();

    if (!word) {
      return Response.json({ error: 'Word required' }, { status: 400 });
    }

    if (complexity === 'simple') {
      const definition = await simpleDefinition(word, targetLang || 'ru');
      return Response.json({ ok: true, definition, headword: word });
    }

    const jsonText = await fullDefinition(word, targetLang || 'ru', sourceLang || 'tr');
    return Response.json({ ok: true, json: jsonText, headword: word });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: `Dictionary lookup failed: ${errorMessage}` }, { status: 500 });
  }
}
