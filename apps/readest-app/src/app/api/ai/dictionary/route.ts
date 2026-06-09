import { validateUserAndToken } from '@/utils/access';
import { generateText, createGateway } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

// ── Model resolution ───────────────────────────────────────────────────

interface ModelConfig {
  provider: 'gateway' | 'gemini' | 'deepseek';
  model: ReturnType<ReturnType<typeof createGateway>>;
}

function resolveModel(body: Record<string, unknown>): ModelConfig | { error: string } {
  const gatewayKey = process.env['AI_GATEWAY_API_KEY'];
  if (gatewayKey) {
    const gateway = createGateway({ apiKey: gatewayKey });
    const modelName =
      (body['gatewayModel'] as string) ||
      process.env['AI_GATEWAY_MODEL'] ||
      'google/gemini-2.5-flash-lite';
    return { provider: 'gateway', model: gateway(modelName) };
  }

  const geminiKey = (body['geminiApiKey'] as string | undefined) || process.env['GEMINI_API_KEY'];
  if (geminiKey) {
    const google = createGoogleGenerativeAI({ apiKey: geminiKey });
    const modelName = (body['geminiModel'] as string) || 'gemini-2.5-flash-lite';
    return { provider: 'gemini', model: google(modelName) };
  }

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

// ── Language helpers ───────────────────────────────────────────────────

const LANG_NAMES: Record<string, string> = {
  ru: 'русский',
  tr: 'Türkçe',
  en: 'English',
  ar: 'العربية',
};

function langName(code: string): string {
  return LANG_NAMES[code] || code;
}

// ── Simple definition ──────────────────────────────────────────────────

async function simpleDefinition(
  word: string,
  targetLang: string,
  model: ModelConfig['model'],
): Promise<string> {
  const tl = langName(targetLang);
  const result = await generateText({
    model,
    system: `You are an Islamic theological dictionary specializing in Risale-i Nur. Give a concise 1-2 sentence definition in ${tl}. Include literal meaning + theological significance. No formatting, no greetings.`,
    prompt: word,
    maxOutputTokens: 200,
    temperature: 0.3,
    abortSignal: AbortSignal.timeout(15000),
  });
  return result.text?.trim() || word;
}

// ── Full word definition (with context) ────────────────────────────────

async function fullDefinition(
  word: string,
  targetLang: string,
  sourceLang: string,
  context: { before?: string; after?: string } | undefined,
  model: ModelConfig['model'],
): Promise<string> {
  const sl = langName(sourceLang);
  const ctxBefore = context?.before ? `"${context.before.slice(-300)}"` : 'нет';
  const ctxAfter = context?.after ? `"${context.after.slice(0, 300)}"` : 'нет';

  const systemPrompts: Record<string, string> = {
    ru: `Ты — эксперт по Рисале-и Нур. Объясни термин "${word}" (язык: ${sl}) на русском языке.

КОНТЕКСТ (где встретился термин):
Перед: ${ctxBefore}
После: ${ctxAfter}

ПОЛНЫЙ СПИСОК КНИГ РИСАЛЕ-И НУР (используй разные, не только Слова/Лучи):
1. Слова (Sözler) • 2. Письма (Mektubat) • 3. Лучи (Lemalar) • 4. Сияния (Şualar)
5. Знамения чудес (İşarat-ül İcaz) • 6. Месневи-и Нурие (Mesnevi-i Nuriye)
7. Посох Моисея (Asa-yı Musa) • 8. Печать сокровенного (Sikke-i Tasdik-i Gaybi)
9. Биография (Tarihçe-i Hayat) • 10. Рассуждения (Muhakemat)
11. Диспуты (Münazarat) • 12. Дамасская проповедь (Hutbe-i Şamiye)
13. Зульфикар (Zülfikar) • 14. Светильник (Sirac-ün Nur) • 15. Сборник талисманов (Tılsımlar Mecmuası)

ОТВЕТЬ СТРОГО JSON (без \`\`\`):
{
  "headword": "${word}",
  "contextualMeaning": "Что значит этот термин ИМЕННО В ДАННОМ КОНТЕКСТЕ. 1-2 предложения.",
  "generalMeaning": "Общее значение термина в Рисале-и Нур. 2-3 предложения.",
  "arabic_equivalent": "арабский эквивалент или null",
  "ottoman_equivalent": "османский вариант или null",
  "grammatical_notes": "грамматика, корень, происхождение или null",
  "quranicReference": "Если термин из Корана — сура:аят и объяснение через Коран. Иначе null.",
  "hadithReference": "Если есть хадис с этим термином — текст хадиса и источник. Иначе null.",
  "risalePassages": [
    {
      "bookName": "Название книги (из списка выше)",
      "quote": "Точная цитата из книги на турецком (оригинал), где раскрывается этот термин. 1-3 предложения.",
      "quoteTranslation": "Перевод этой цитаты на русский язык.",
      "context": "Как этот термин раскрывается в данной цитате. Какая грань смысла показана.",
      "relevance": "Почему это место относится к контексту запроса"
    }
  ],
  "usage_level": "basic|intermediate|advanced",
  "sourceSummary": "Какие источники реально использованы (конкретные книги и главы)"
}
КРИТИЧЕСКИ ВАЖНО:
- Приведи 2-3 места из РАЗНЫХ книг Рисале-и Нур. Разнообразие источников обязательно.
- Каждая цитата должна быть ТОЧНОЙ (как в оригинале) на турецком + перевод на русский.
- Если термин из Корана — дай кораническое объяснение с аятом.
- Объясняй В КОНТЕКСТЕ окружающего текста.`,
    en: `You are a Risale-i Nur expert. Explain the term "${word}" (source: ${sl}) in English.

CONTEXT (where the term appears):
Before: ${ctxBefore}
After: ${ctxAfter}

COMPLETE LIST OF RISALE-I NUR BOOKS (draw from diverse sources, not just Sözler/Lemalar):
1. Sözler (The Words) • 2. Mektubat (The Letters) • 3. Lemalar (The Flashes)
4. Şualar (The Rays) • 5. İşarat-ül İcaz (Signs of Miraculousness)
6. Mesnevi-i Nuriye • 7. Asa-yı Musa (The Staff of Moses)
8. Sikke-i Tasdik-i Gaybi (The Seal of Hidden Affirmation)
9. Tarihçe-i Hayat (Biography) • 10. Muhakemat (Reasonings)
11. Münazarat (Debates) • 12. Hutbe-i Şamiye (The Damascus Sermon)
13. Zülfikar • 14. Sirac-ün Nur (The Lamp of Light)
15. Tılsımlar Mecmuası (Collection of Talismans)

RESPOND STRICT JSON (no \`\`\`):
{
  "headword": "${word}",
  "contextualMeaning": "What this term means IN THIS SPECIFIC CONTEXT. 1-2 sentences.",
  "generalMeaning": "General meaning in Risale-i Nur. 2-3 sentences.",
  "arabic_equivalent": "Arabic equivalent or null",
  "ottoman_equivalent": "Ottoman variant or null",
  "grammatical_notes": "Grammar, root, origin or null",
  "quranicReference": "If from Quran — surah:ayah and explanation. Otherwise null.",
  "hadithReference": "If hadith exists — text and source. Otherwise null.",
  "risalePassages": [
    {
      "bookName": "Book name (from the list above)",
      "quote": "Exact quote from the book in Turkish (original) where this term is elaborated. 1-3 sentences.",
      "quoteTranslation": "English translation of this quote.",
      "context": "How this term is elaborated in this passage. What aspect of meaning is shown.",
      "relevance": "Why this relates to the query context"
    }
  ],
  "usage_level": "basic|intermediate|advanced",
  "sourceSummary": "Sources actually used (specific books and chapters)"
}
CRITICAL:
- Provide 2-3 passages from DIFFERENT books (not just Sözler/Lemalar). Source diversity is mandatory.
- Each passage MUST include an exact Turkish quote + English translation.
- If the term is from the Quran — provide the ayah with explanation.
- Explain IN THE CONTEXT of the surrounding text.`,
    tr: `Sen Risale-i Nur uzmanısın. "${word}" terimini (kaynak: ${sl}) Türkçe açıkla.

BAĞLAM (terimin geçtiği yer):
Önce: ${ctxBefore}
Sonra: ${ctxAfter}

RİSALE-İ NUR KÜLLİYATI (farklı kitaplardan alıntı yap, sadece Sözler/Lemalar değil):
1. Sözler • 2. Mektubat • 3. Lemalar • 4. Şualar • 5. İşarat-ül İcaz
6. Mesnevi-i Nuriye • 7. Asa-yı Musa • 8. Sikke-i Tasdik-i Gaybi
9. Tarihçe-i Hayat • 10. Muhakemat • 11. Münazarat • 12. Hutbe-i Şamiye
13. Zülfikar • 14. Sirac-ün Nur • 15. Tılsımlar Mecmuası

SADECE JSON (\`\`\` olmadan):
{
  "headword": "${word}",
  "contextualMeaning": "Bu terim BU BAĞLAMDA ne anlama geliyor. 1-2 cümle.",
  "generalMeaning": "Risale-i Nur'daki genel anlamı. 2-3 cümle.",
  "arabic_equivalent": "Arapçası veya null",
  "ottoman_equivalent": "Osmanlıcası veya null",
  "grammatical_notes": "Gramer, köken veya null",
  "quranicReference": "Kuran'dan ise — sure:ayet ve açıklama. Değilse null.",
  "hadithReference": "Hadis varsa — metin ve kaynak. Yoksa null.",
  "risalePassages": [
    {
      "bookName": "Kitap adı (yukarıdaki listeden)",
      "quote": "Terimin geçtiği orijinal Türkçe metinden tam alıntı. 1-3 cümle.",
      "quoteTranslation": "Bu alıntının Türkçe çevirisi (osmanlıca ise sadeleştir).",
      "context": "Bu pasajda terim nasıl açıklanıyor. Hangi anlam boyutu gösteriliyor.",
      "relevance": "Sorgu bağlamıyla ilgisi"
    }
  ],
  "usage_level": "basic|intermediate|advanced",
  "sourceSummary": "Kullanılan kaynaklar (hangi kitap ve bölüm)"
}
KRİTİK:
- 2-3 FARKLI kitaptan alıntı yap (sadece Sözler/Lemalar değil). Kaynak çeşitliliği zorunlu.
- Her alıntı TAM Türkçe orijinal metin + çeviri içermeli.
- Terim Kuran'dan ise — ayet ile açıkla.
- ÇEVRELEYEN metin bağlamında açıkla.`,
  };
  const system = systemPrompts[targetLang] ?? systemPrompts['en']!;

  const result = await generateText({
    model,
    system,
    prompt: `Объясни термин: ${word}`,
    maxOutputTokens: 1200,
    temperature: 0.5,
    abortSignal: AbortSignal.timeout(25000),
  });

  return result.text?.trim() || '';
}

// ── Passage analysis ───────────────────────────────────────────────────

async function analyzePassage(
  text: string,
  targetLang: string,
  sourceLang: string,
  context: { before?: string; after?: string } | undefined,
  model: ModelConfig['model'],
): Promise<string> {
  const sl = langName(sourceLang);
  const ctxBefore = context?.before ? context.before.slice(-500) : 'нет';
  const ctxAfter = context?.after ? context.after.slice(0, 500) : 'нет';

  const systemPrompts: Record<string, string> = {
    ru: `Ты — эксперт по Рисале-и Нур. Проанализируй выделенный ОТРЫВОК на русском языке.

Выделенный отрывок (${sl}):
"${text}"

КОНТЕКСТ (что вокруг):
ПЕРЕД отрывком: ${ctxBefore}
ПОСЛЕ отрывка: ${ctxAfter}

ОТВЕТЬ СТРОГО JSON (без \`\`\`):
{
  "passageSummary": "О чём этот отрывок? Краткий смысл. 2-3 предложения на русском.",
  "approximateTranslation": "Примерный смысловой перевод отрывка на русский язык.",
  "contextNote": "Как этот отрывок связан с тем, что идёт до и после него? 1-2 предложения.",
  "complexTerms": [
    {
      "term": "сложный термин из отрывка",
      "contextualDefinition": "Что значит в данном контексте",
      "generalDefinition": "Общее значение в Рисале-и Нур",
      "arabic": "арабский эквивалент или null",
      "quranicRef": "кораническая ссылка или null",
      "hadithRef": "ссылка на хадис или null"
    }
  ],
  "keyInsight": "Главный урок/мысль этого отрывка. 1 предложение.",
  "sourceSummary": "Какие источники использованы"
}
ВАЖНО:
- Выдели ВСЕ сложные термины из отрывка (минимум 2-3).
- Для каждого термина дай объяснение В КОНТЕКСТЕ отрывка.
- Используй Коран и Хадисы где уместно.
- Объясни связь с окружающим текстом.`,
    en: `You are a Risale-i Nur expert. Analyze the selected PASSAGE in English.

Selected passage (${sl}):
"${text}"

SURROUNDING CONTEXT:
BEFORE: ${ctxBefore}
AFTER: ${ctxAfter}

STRICT JSON (no \`\`\`):
{
  "passageSummary": "What is this passage about? 2-3 sentences.",
  "approximateTranslation": "Approximate translation to English.",
  "contextNote": "How does this connect to surrounding text? 1-2 sentences.",
  "complexTerms": [
    {
      "term": "complex term from passage",
      "contextualDefinition": "Meaning in this context",
      "generalDefinition": "General Risale-i Nur meaning",
      "arabic": "Arabic equivalent or null",
      "quranicRef": "Quranic reference or null",
      "hadithRef": "Hadith reference or null"
    }
  ],
  "keyInsight": "Main lesson from this passage. 1 sentence.",
  "sourceSummary": "Sources used"
}
Extract ALL complex theological terms (min 2-3). Explain each in context. Use Quran/Hadith.`,
    tr: `Sen Risale-i Nur uzmanısın. Seçili METNİ Türkçe analiz et.

Seçili metin (${sl}):
"${text}"

BAĞLAM:
ÖNCE: ${ctxBefore}
SONRA: ${ctxAfter}

SADECE JSON ( \`\`\` olmadan):
{
  "passageSummary": "Bu metin ne hakkında? 2-3 cümle.",
  "approximateTranslation": "Metnin yaklaşık Türkçe çevirisi.",
  "contextNote": "Çevreleyen metinle bağlantısı. 1-2 cümle.",
  "complexTerms": [
    {
      "term": "metindeki karmaşık terim",
      "contextualDefinition": "Bu bağlamda anlamı",
      "generalDefinition": "Risale-i Nur'daki genel anlamı",
      "arabic": "Arapçası veya null",
      "quranicRef": "Kuran referansı veya null",
      "hadithRef": "Hadis referansı veya null"
    }
  ],
  "keyInsight": "Ana ders. 1 cümle.",
  "sourceSummary": "Kullanılan kaynaklar"
}
TÜM karmaşık terimleri çıkar (en az 2-3). Her birini bağlamda açıkla. Kuran/Hadis kullan.`,
  };
  const system = systemPrompts[targetLang] ?? systemPrompts['en']!;

  const result = await generateText({
    model,
    system,
    prompt: `Проанализируй отрывок из Рисале-и Нур`,
    maxOutputTokens: 2000,
    temperature: 0.5,
    abortSignal: AbortSignal.timeout(35000),
  });

  return result.text?.trim() || '';
}

// ── Route handler ──────────────────────────────────────────────────────

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const {
      word,
      targetLang = 'ru',
      sourceLang = 'tr',
      complexity = 'complex',
      mode = 'word',
      context,
    } = body;

    // Health check
    if (complexity === 'health') {
      const resolved = resolveModel(body);
      if ('error' in resolved) {
        return Response.json({ ok: false, error: resolved.error });
      }
      const def = await simpleDefinition('hello', targetLang || 'en', resolved.model);
      return Response.json({ ok: true, definition: def });
    }

    // Auth: skip when user provides their own API key, OR when the server
    // has a default key configured (e.g. DEEPSEEK_API_KEY in env).
    // This lets the app work out-of-the-box for all users while still
    // allowing individuals to override with their own keys via Settings → AI.
    const userProvidedKey = !!(body['geminiApiKey'] || body['deepseekApiKey']);
    const serverHasDefaultKey = !!(
      process.env['AI_GATEWAY_API_KEY'] ||
      process.env['GEMINI_API_KEY'] ||
      process.env['DEEPSEEK_API_KEY']
    );
    if (!userProvidedKey && !serverHasDefaultKey) {
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

    // Simple definition
    if (complexity === 'simple') {
      const definition = await simpleDefinition(word, targetLang, resolved.model);
      return Response.json({ ok: true, definition, headword: word, mode: 'word' });
    }

    // Passage analysis mode (selection of sentence/paragraph)
    if (mode === 'passage') {
      let jsonText = await analyzePassage(
        word, // In passage mode, 'word' contains the full selected text
        targetLang,
        sourceLang,
        context as { before?: string; after?: string } | undefined,
        resolved.model,
      );
      jsonText = jsonText.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
      }
      return Response.json({ ok: true, json: jsonText, headword: word, mode: 'passage' });
    }

    // Full word definition (with context)
    let jsonText = await fullDefinition(
      word,
      targetLang,
      sourceLang,
      context as { before?: string; after?: string } | undefined,
      resolved.model,
    );
    jsonText = jsonText.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }
    return Response.json({ ok: true, json: jsonText, headword: word, mode: 'word' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: `Dictionary lookup failed: ${errorMessage}` }, { status: 500 });
  }
}
