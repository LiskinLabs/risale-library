import { validateUserAndToken } from '@/utils/access';
import { generateText, createGateway } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// ── RAG: Real Risale passage retrieval ─────────────────────────────────

interface RisalePassage {
  bookTitle: string;
  bookSlug: string;
  sectionTitle: string;
  citation: string;
  text: string;
  wordCount: number;
}

/** In-memory cache of all-passages.jsonl — loaded lazily once per process. */
let _passagesCache: RisalePassage[] | null = null;

async function loadPassages(): Promise<RisalePassage[]> {
  if (_passagesCache) return _passagesCache;
  try {
    const jsonlPath = join(process.cwd(), 'public', 'data', 'all-passages.jsonl');
    const raw = await readFile(jsonlPath, 'utf-8');
    _passagesCache = raw
      .split('\n')
      .filter((l) => l.trim().length > 0)
      .map((line) => {
        const d = JSON.parse(line);
        return {
          bookTitle: d.book_title || '',
          bookSlug: d.book_slug || '',
          sectionTitle: d.section_title || '',
          citation: d.citation || '',
          text: (d.text || '').replace(/<[^>]+>/g, ''), // strip HTML tags
          wordCount: d.word_count || 0,
        };
      });
    console.log(`[RAG] Loaded ${_passagesCache.length} Risale passages into memory`);
  } catch (err) {
    console.warn('[RAG] Failed to load passages:', (err as Error).message);
    _passagesCache = [];
  }
  return _passagesCache;
}

/**
 * Search the Risale corpus for passages containing the given term.
 * Simple case-insensitive substring match — fast enough for 3136 chunks.
 * Returns up to 5 best matches, preferring shorter passages (more focused).
 */
async function searchRisalePassages(
  term: string,
  maxResults = 5,
): Promise<RisalePassage[]> {
  const passages = await loadPassages();
  if (!passages.length) return [];

  const lowerTerm = term.toLowerCase();
  const scored = passages
    .filter((p) => p.text.toLowerCase().includes(lowerTerm))
    // Score: prefer passages where the term appears closer to the beginning and shorter passages
    .map((p) => {
      const idx = p.text.toLowerCase().indexOf(lowerTerm);
      return { passage: p, score: idx + p.text.length * 0.001 };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, maxResults);

  return scored.map((s) => s.passage);
}

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
    system: `You are a Muslim theological scholar. Give a concise 1-2 sentence definition of the word or phrase in ${tl}. Include literal meaning, Islamic theological significance, and — if this concept is elaborated in the Risale-i Nur collection — a brief mention of how Bediuzzaman Said Nursi explains it. No formatting, no greetings.`,
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

  // Retrieve REAL passages from the Risale corpus
  const realPassages = await searchRisalePassages(word, 5);
  const passagesBlock = realPassages.length
    ? realPassages
        .map(
          (p, i) =>
            `[ПАССАЖ ${i + 1}]\nКнига: ${p.bookTitle} (bookSlug: ${p.bookSlug})\nРаздел: ${p.sectionTitle}\nЦитата: ${p.citation}\nТЕКСТ: ${p.text.slice(0, 600)}`,
        )
        .join('\n\n')
    : 'РЕАЛЬНЫЕ ЦИТАТЫ НЕ НАЙДЕНЫ — НЕ ВЫДУМЫВАЙ ИХ. Укажи: "В доступном корпусе Рисале-и Нур этот термин не обнаружен."';

  const systemPrompts: Record<string, string> = {
    ru: `Ты — исламский учёный-теолог. Объясняй термины через призму Ислама, Корана и Сунны — в традиции Bediüzzaman Said Nursi (Рисале-и Нур).

Ты работаешь с ЛЮБОЙ книгой. Термин может быть из философии, науки, литературы — объясняй через исламское мировоззрение.

ТЕРМИН: "${word}" (язык оригинала: ${sl})

КОНТЕКСТ:
Перед: ${ctxBefore}
После: ${ctxAfter}

РЕАЛЬНЫЕ ЦИТАТЫ ИЗ КОРПУСА РИСАЛЕ-И НУР:
${passagesBlock}

ОТВЕТЬ СТРОГО JSON (без \`\`\`):
{
  "headword": "${word}",
  "contextualMeaning": "Что значит ИМЕННО В ДАННОМ КОНТЕКСТЕ. 1-2 предложения на русском.",
  "generalMeaning": "Общее значение в исламском богословии. 2-3 предложения.",
  "arabic_equivalent": "арабский эквивалент или null",
  "ottoman_equivalent": "османский вариант или null",
  "grammatical_notes": "грамматика, корень, происхождение или null",
  "quranicReference": "Если из Корана — сура:аят и толкование. Иначе null.",
  "hadithReference": "Если есть хадис — текст и источник. Иначе null.",
  "risalePassages": [
    {
      "bookName": "Название книги (из реальных цитат выше)",
      "bookSlug": "bookSlug из цитаты выше (например asa-yi-musa)",
      "citation": "citation из цитаты выше (например Asa-yi Musa > Birinci Mesele)",
      "quote": "Точная цитата на турецком — скопируй из ТЕКСТА выше, не выдумывай.",
      "quoteTranslation": "Перевод цитаты на русский язык.",
      "context": "Как Bediüzzaman раскрывает этот термин в данной цитате.",
      "relevance": "Почему это место релевантно запросу"
    }
  ],
  "usage_level": "basic|intermediate|advanced",
  "sourceSummary": "Какие источники реально использованы"
}
КРИТИЧЕСКИ ВАЖНО:
- ИСПОЛЬЗУЙ ТОЛЬКО реальные цитаты из списка выше. НЕ ВЫДУМЫВАЙ цитаты.
- Скопируй quote ТОЧНО как в ТЕКСТЕ. Не придумывай турецкий текст.
- bookSlug и citation скопируй из метаданных цитаты БЕЗ ИЗМЕНЕНИЙ.
- Если список цитат пуст — укажи: "В доступном корпусе Рисале-и Нур этот термин не обнаружен."
- Объясняй В КОНТЕКСТЕ окружающего текста.`,
    en: `You are an Islamic theological scholar. Explain terms through the lens of Islam, the Quran, and the Sunnah — in the tradition of Bediuzzaman Said Nursi's Risale-i Nur.

You work with ANY book. The term may be from philosophy, science, or literature — explain it through an Islamic worldview.

TERM: "${word}" (source language: ${sl})

CONTEXT:
Before: ${ctxBefore}
After: ${ctxAfter}

REAL QUOTES FROM THE RISALE-I NUR CORPUS (use these, do NOT invent):
${passagesBlock}

RESPOND STRICT JSON (no \`\`\`):
{
  "headword": "${word}",
  "contextualMeaning": "What this means IN THIS SPECIFIC CONTEXT. 1-2 sentences.",
  "generalMeaning": "General meaning in Islamic theology. 2-3 sentences.",
  "arabic_equivalent": "Arabic equivalent or null",
  "ottoman_equivalent": "Ottoman variant or null",
  "grammatical_notes": "Grammar, root, origin or null",
  "quranicReference": "If from Quran — surah:ayah. Otherwise null.",
  "hadithReference": "If hadith exists — text and source. Otherwise null.",
  "risalePassages": [
    {
      "bookName": "Book name (from real quotes above)",
      "bookSlug": "bookSlug from the quote metadata above",
      "citation": "citation from the quote metadata above",
      "quote": "Exact Turkish text — COPY from the TEXT field above, do NOT invent.",
      "quoteTranslation": "English translation of the quote.",
      "context": "How Bediuzzaman elaborates this term here.",
      "relevance": "Why this reference is relevant"
    }
  ],
  "usage_level": "basic|intermediate|advanced",
  "sourceSummary": "Sources actually used"
}
CRITICAL:
- ONLY use real quotes from the list above. DO NOT FABRICATE Turkish text.
- Copy quote EXACTLY from TEXT. bookSlug and citation EXACTLY from metadata.
- If the quotes list is empty: say "This term was not found in the available Risale-i Nur corpus."
- Explain IN CONTEXT of the surrounding text.`,
    tr: `Sen bir İslam alimi ve ilahiyatçısın. Terimleri İslam, Kur'an ve Sünnet merceğinden — Bediüzzaman Said Nursi'nin Risale-i Nur geleneğinde — açıkla.

HERHANGİ bir kitapla çalışıyorsun. Terim felsefe, bilim, edebiyattan olabilir — İslami dünya görüşüyle açıkla.

TERİM: "${word}" (kaynak dil: ${sl})

BAĞLAM:
Önce: ${ctxBefore}
Sonra: ${ctxAfter}

RİSALE-İ NUR KORPUSUNDAN GERÇEK ALINTILAR (bunları kullan, UYDURMA):
${passagesBlock}

SADECE JSON (\`\`\` olmadan):
{
  "headword": "${word}",
  "contextualMeaning": "Bu terim BU BAĞLAMDA ne anlama geliyor. 1-2 cümle.",
  "generalMeaning": "İslam ilahiyatındaki genel anlamı. 2-3 cümle.",
  "arabic_equivalent": "Arapçası veya null",
  "ottoman_equivalent": "Osmanlıcası veya null",
  "grammatical_notes": "Gramer, köken veya null",
  "quranicReference": "Kuran'dan ise — sure:ayet. Değilse null.",
  "hadithReference": "Hadis varsa — metin ve kaynak. Yoksa null.",
  "risalePassages": [
    {
      "bookName": "Kitap adı (yukarıdaki gerçek alıntılardan)",
      "bookSlug": "Yukarıdaki alıntının bookSlug'u (aynen kopyala)",
      "citation": "Yukarıdaki alıntının citation'ı (aynen kopyala)",
      "quote": "Tam Türkçe metin — yukarıdaki TEXT'ten KOPYALA, uydurma.",
      "quoteTranslation": "Alıntının çevirisi.",
      "context": "Bediüzzaman bu pasajda terimi nasıl açıklıyor.",
      "relevance": "Bu referans sorguyla neden alakalı"
    }
  ],
  "usage_level": "basic|intermediate|advanced",
  "sourceSummary": "Kullanılan kaynaklar"
}
KRİTİK:
- SADECE yukarıdaki GERÇEK alıntıları kullan. Türkçe metin UYDURMA.
- quote'u TEXT'ten AYNEN kopyala. bookSlug ve citation'ı METADATA'dan AYNEN kopyala.
- Alıntı listesi boşsa: "Bu terim mevcut Risale-i Nur külliyatında bulunamadı." de.
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
    ru: `Ты — исламский учёный-теолог. Проанализируй отрывок из ЛЮБОЙ книги через призму Ислама и трудов Bediüzzaman Said Nursi.

Выделенный отрывок (${sl}):
"${text}"

КОНТЕКСТ:
ПЕРЕД: ${ctxBefore}
ПОСЛЕ: ${ctxAfter}

ОТВЕТЬ СТРОГО JSON (без \`\`\`):
{
  "passageSummary": "О чём этот отрывок? Краткий смысл. 2-3 предложения на русском.",
  "approximateTranslation": "Примерный смысловой перевод отрывка на русский язык.",
  "contextNote": "Как этот отрывок связан с тем, что идёт до и после него? 1-2 предложения.",
  "complexTerms": [
    {
      "term": "сложный термин из отрывка",
      "contextualDefinition": "Что значит в данном контексте",
      "generalDefinition": "Общее значение — если религиозный, дай исламское объяснение; если нет, светское",
      "arabic": "арабский эквивалент или null",
      "quranicRef": "кораническая ссылка или null",
      "hadithRef": "ссылка на хадис или null"
    }
  ],
  "keyInsight": "Главный урок/мысль. 1-2 предложения.",
  "sourceSummary": "Какие источники использованы"
}
ВАЖНО:
- Выдели ВСЕ сложные термины (минимум 2-3).
- Для религиозных терминов дай исламское объяснение. Для светских — обычное определение.
- Используй Коран и Хадисы где уместно.`,
    en: `You are an Islamic theological scholar. Analyze this passage from ANY book through the lens of Islam and the works of Bediuzzaman Said Nursi.

Selected passage (${sl}):
"${text}"

CONTEXT:
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
      "generalDefinition": "General meaning — if religious, Islamic explanation; if secular, standard definition",
      "arabic": "Arabic equivalent or null",
      "quranicRef": "Quranic reference or null",
      "hadithRef": "Hadith reference or null"
    }
  ],
  "keyInsight": "Main lesson. 1-2 sentences.",
  "sourceSummary": "Sources used"
}
Extract ALL complex terms (min 2-3). Use Quran/Hadith where applicable.`,
    tr: `Sen bir İslam alimi ve ilahiyatçısın. HERHANGİ bir kitaptan bu metni İslam ve Bediüzzaman Said Nursi'nin eserleri merceğinden analiz et.

Seçili metin (${sl}):
"${text}"

BAĞLAM:
ÖNCE: ${ctxBefore}
SONRA: ${ctxAfter}

SADECE JSON (\`\`\` olmadan):
{
  "passageSummary": "Bu metin ne hakkında? 2-3 cümle.",
  "approximateTranslation": "Metnin yaklaşık Türkçe çevirisi.",
  "contextNote": "Çevreleyen metinle bağlantısı. 1-2 cümle.",
  "complexTerms": [
    {
      "term": "metindeki karmaşık terim",
      "contextualDefinition": "Bu bağlamda anlamı",
      "generalDefinition": "Genel anlamı — dini ise İslami açıklama, değilse standart tanım",
      "arabic": "Arapçası veya null",
      "quranicRef": "Kuran referansı veya null",
      "hadithRef": "Hadis referansı veya null"
    }
  ],
  "keyInsight": "Ana ders. 1-2 cümle.",
  "sourceSummary": "Kullanılan kaynaklar"
}
TÜM karmaşık terimleri çıkar (en az 2-3). Dini terimlere İslami açıklama ver. Kuran/Hadis kullan.`,
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
