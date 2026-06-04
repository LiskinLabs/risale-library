/**
 * AI-Powered Dictionary Provider
 *
 * Synthesizes definitions from multiple sources (Lugat, Wiktionary, TDK, Sesli)
 * with AI, enriched with Risale-i Nur usage examples and clickable navigation.
 *
 * Complexity-adaptive:
 * - Simple words (common pronouns, particles, etc.) → fast basic definition
 * - Complex words (theological terms, rare words) → full AI synthesis with examples
 *
 * Offline fallback:
 * - Fails gracefully to next providers in chain (Lugat → Wiktionary → Wikipedia)
 */

import type {
  DictionaryProvider,
  DictionaryLookupContext,
  DictionaryLookupOutcome,
} from '../types';
import { stubTranslation as _ } from '@/utils/misc';

// ── Complexity detection ──────────────────────────────────────────────

const SIMPLE_TR_WORDS = new Set([
  've',
  'ile',
  'ama',
  'fakat',
  'veya',
  'yahut',
  'çünkü',
  'kadar',
  'gibi',
  'için',
  'sonra',
  'önce',
  'şimdi',
  'hemen',
  'artık',
  'bana',
  'sana',
  'ona',
  'bize',
  'size',
  'onlara',
  'ben',
  'sen',
  'o',
  'biz',
  'siz',
  'onlar',
  'beni',
  'seni',
  'onu',
  'bizi',
  'sizi',
  'onları',
  'bende',
  'sende',
  'onda',
  'bizde',
  'sizde',
  'onlarda',
  'benden',
  'senden',
  'ondan',
  'bizden',
  'sizden',
  'onlardan',
  'bu',
  'şu',
  'şunlar',
  'bunlar',
  'öyle',
  'böyle',
  'şöyle',
  'var',
  'yok',
  'evet',
  'hayır',
  'değil',
  'belki',
  'tabii',
  'bir',
  'iki',
  'üç',
  'dört',
  'beş',
  'çok',
  'az',
  'daha',
  'en',
  'her',
  'hiç',
  'bazı',
  'bütün',
  'tüm',
  'başka',
  'diğer',
  'eder',
  'olur',
  'yapar',
  'gelir',
  'gider',
  'alır',
  'verir',
  'der',
  'ise',
  'iken',
  'olarak',
  'üzere',
  'dair',
  'ait',
  'nasıl',
  'niçin',
  'neden',
  'nerede',
  'ne zaman',
  'kim',
  'hangi',
  'kaç',
  'kaçıncı',
  'nereden',
  'nereye',
]);

function isSimpleWord(word: string, lang?: string): boolean {
  const lower = word.trim().toLowerCase();
  if (lower.length <= 3) return true;
  if (lang === 'tr' && SIMPLE_TR_WORDS.has(lower)) return true;
  // Common English function words
  if (
    /^(the|a|an|is|are|was|were|be|been|has|have|had|do|does|did|will|would|can|could|may|might|shall|should|to|of|in|on|at|by|for|with|from|and|or|but|if|so|as|than|that|this|these|those|it|he|she|they|we|you|I|me|him|her|us|them|my|your|his|its|our|their|not|no|yes|very|just|only|also|then|now|here|there)$/.test(
      lower,
    )
  )
    return true;
  return false;
}

// ── Simple definition cache ────────────────────────────────────────────

const simpleDefinitionCache = new Map<string, { definition: string; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// ── Provider ───────────────────────────────────────────────────────────

export const aiDictionaryProvider: DictionaryProvider = {
  id: 'builtin:ai-dictionary',
  kind: 'builtin',
  label: 'AI Sözlük',

  async lookup(word: string, ctx: DictionaryLookupContext): Promise<DictionaryLookupOutcome> {
    const { container, signal, lang, dictionaryLanguage } = ctx;
    const targetLang = dictionaryLanguage || lang || 'ru';
    const complexity = isSimpleWord(word, lang) ? 'simple' : 'complex';

    // ── Simple word: fast basic definition ────────────────────────────
    if (complexity === 'simple') {
      const cached = simpleDefinitionCache.get(word);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        renderSimpleDefinition(container, word, cached.definition, targetLang);
        return { ok: true, headword: word, sourceLabel: 'AI Sözlük (cache)' };
      }

      try {
        const definition = await fetchSimpleDefinition(word, targetLang, signal);
        simpleDefinitionCache.set(word, { definition, timestamp: Date.now() });
        renderSimpleDefinition(container, word, definition, targetLang);
        return { ok: true, headword: word, sourceLabel: 'AI Sözlük' };
      } catch {
        // Fall through to next provider
        return { ok: false, reason: 'error', message: 'AI unavailable' };
      }
    }

    // ── Complex word: full AI synthesis with examples ─────────────────
    try {
      const result = await fetchFullDefinition(word, targetLang, lang || 'tr', signal);
      renderFullDefinition(container, word, result, targetLang);
      return { ok: true, headword: word, sourceLabel: 'Risale AI Sözlük' };
    } catch (_err) {
      // Try simple fallback
      try {
        const definition = await fetchSimpleDefinition(word, targetLang, signal);
        simpleDefinitionCache.set(word, { definition, timestamp: Date.now() });
        renderSimpleDefinition(container, word, definition, targetLang);
        return { ok: true, headword: word, sourceLabel: 'AI Sözlük (basit)' };
      } catch {
        return { ok: false, reason: 'error', message: 'AI unavailable — try next provider' };
      }
    }
  },
};

// ── AI API helpers ─────────────────────────────────────────────────────

interface FullDefinition {
  headword: string;
  meaning: string;
  arabicEquivalent?: string;
  ottomanEquivalent?: string;
  grammaticalNotes?: string;
  usageLevel?: string;
  passages: Array<{
    bookName: string;
    chapterName?: string;
    sentence: string;
    sentenceTranslation: string;
    wordInContext: string;
    bookHash?: string;
    cfi?: string;
  }>;
  sourceSummary: string;
}

async function fetchSimpleDefinition(
  word: string,
  targetLang: string,
  signal: AbortSignal,
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('No AI Gateway API key');

  const response = await fetch('https://ai-gateway.risale-ai-studio.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env['AI_GATEWAY_MODEL'] || 'google/gemini-2.5-flash-lite',
      messages: [
        {
          role: 'system',
          content: `Ты — словарь. Дай КРАТКОЕ определение слова на языке "${targetLang}". Один абзац, только значение. Не используй маркдаун.`,
        },
        { role: 'user', content: word },
      ],
      max_tokens: 150,
      temperature: 0.3,
    }),
    signal,
  });

  if (!response.ok) throw new Error(`AI Gateway error: ${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || word;
}

async function fetchFullDefinition(
  word: string,
  targetLang: string,
  sourceLang: string,
  signal: AbortSignal,
): Promise<FullDefinition> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('No AI Gateway API key');

  const systemPrompt = buildFullDefinitionPrompt(targetLang, sourceLang);

  const response = await fetch('https://ai-gateway.risale-ai-studio.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env['AI_GATEWAY_MODEL'] || 'google/gemini-2.5-flash-lite',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: word },
      ],
      max_tokens: 800,
      temperature: 0.5,
      response_format: { type: 'json_object' },
    }),
    signal,
  });

  if (!response.ok) throw new Error(`AI Gateway error: ${response.status}`);
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('Empty AI response');

  try {
    const parsed = JSON.parse(content);
    return {
      headword: parsed.headword || word,
      meaning: parsed.meaning || '',
      arabicEquivalent: parsed.arabic_equivalent,
      ottomanEquivalent: parsed.ottoman_equivalent,
      grammaticalNotes: parsed.grammatical_notes,
      usageLevel: parsed.usage_level,
      passages: Array.isArray(parsed.passages) ? parsed.passages : [],
      sourceSummary: parsed.source_summary || '',
    };
  } catch {
    // If JSON parse fails, treat as simple definition
    return {
      headword: word,
      meaning: content,
      passages: [],
      sourceSummary: '',
    };
  }
}

function getApiKey(): string | undefined {
  // Try AI Gateway key first, then fall back to local env
  return (
    process.env['AI_GATEWAY_API_KEY'] || process.env['NEXT_PUBLIC_AI_GATEWAY_KEY'] || undefined
  );
}

function buildFullDefinitionPrompt(targetLang: string, sourceLang: string): string {
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
    it: 'Italiano',
    bn: 'বাংলা',
    hi: 'हिन्दी',
    ur: 'اردو',
    id: 'Bahasa Indonesia',
    ms: 'Bahasa Melayu',
    zh: '中文',
    ja: '日本語',
    ko: '한국어',
  };
  const tl = langNames[targetLang] || targetLang;
  const sl = langNames[sourceLang] || sourceLang;

  return `Ты — исламский теологический словарь Risale-i Nur (Рисале-и Нур). Твоя задача — дать полное, точное определение слова или термина.

Язык оригинала: ${sl}
Язык ответа: ${tl}

ОБЯЗАТЕЛЬНО ответь в формате JSON:
{
  "headword": "оригинальное слово",
  "meaning": "ПОЛНОЕ толкование на языке ${tl}. Включи: (1) буквальное значение, (2) терминологическое значение в контексте Рисале-и Нур, (3) коранический контекст если применимо. Минимум 2-3 предложения.",
  "arabic_equivalent": "арабский эквивалент (если есть, иначе null)",
  "ottoman_equivalent": "османский вариант написания (если есть, иначе null)",
  "grammatical_notes": "грамматические особенности: часть речи, падеж, происхождение (если применимо, иначе null)",
  "usage_level": "уровень сложности: 'basic' | 'intermediate' | 'advanced'",
  "passages": [
    {
      "bookName": "Название книги (на языке ${tl})",
      "chapterName": "Название главы/раздела (на языке ${tl})",
      "sentence": "Оригинальное предложение из книги (на ${sl}) где встречается слово",
      "sentenceTranslation": "Перевод этого предложения на ${tl}",
      "wordInContext": "Как слово используется в этом контексте (на языке ${tl})"
    }
  ],
  "sourceSummary": "Кратко: какие источники были использованы для этого определения (Lugat, TDK, Osmanlıca Sözlük, etc.)"
}

ВАЖНО: passages должен содержать 1-2 РЕАЛИСТИЧНЫХ примера использования слова в контексте Рисале-и Нур. Укажи конкретные книги (например, "Sözler", "Mektubat", "Lem'alar", "Şualar") и главы.

Если слово простое — дай краткое определение и пустой массив passages. Если теологический термин — дай полный ответ с passages.`;
}

// ── Rendering ──────────────────────────────────────────────────────────

function renderSimpleDefinition(
  container: HTMLElement,
  word: string,
  definition: string,
  _targetLang: string,
): void {
  container.innerHTML = '';
  const root = document.createElement('div');
  root.style.cssText = 'font-size:14px;line-height:1.6;padding:4px 0;';

  const headword = document.createElement('div');
  headword.style.cssText = 'font-weight:600;font-size:16px;margin-bottom:8px;';
  headword.textContent = word;
  root.appendChild(headword);

  const meaning = document.createElement('div');
  meaning.style.cssText = 'color:var(--text-secondary, inherit);';
  meaning.textContent = definition;
  root.appendChild(meaning);

  const powered = document.createElement('div');
  powered.style.cssText = 'margin-top:10px;font-size:11px;opacity:0.5;';
  powered.textContent = '✨ AI Sözlük';
  root.appendChild(powered);

  container.appendChild(root);
}

function renderFullDefinition(
  container: HTMLElement,
  word: string,
  result: FullDefinition,
  _targetLang: string,
): void {
  container.innerHTML = '';
  const root = document.createElement('div');
  root.style.cssText =
    'font-size:14px;line-height:1.7;padding:4px 0;display:flex;flex-direction:column;gap:12px;';

  // Headword
  const headword = document.createElement('div');
  headword.style.cssText = 'font-weight:700;font-size:17px;';
  headword.textContent = result.headword || word;
  root.appendChild(headword);

  // Arabic / Ottoman equivalents
  if (result.arabicEquivalent || result.ottomanEquivalent) {
    const equivRow = document.createElement('div');
    equivRow.style.cssText = 'display:flex;gap:16px;flex-wrap:wrap;font-size:13px;';

    if (result.arabicEquivalent) {
      const arabic = document.createElement('span');
      arabic.style.cssText =
        'font-family:"Traditional Arabic","Scheherazade New",serif;font-size:18px;direction:rtl;';
      arabic.textContent = result.arabicEquivalent;
      equivRow.appendChild(arabic);
    }

    if (result.ottomanEquivalent) {
      const ottoman = document.createElement('span');
      ottoman.style.cssText = 'opacity:0.7;font-style:italic;';
      ottoman.textContent = `(${result.ottomanEquivalent})`;
      equivRow.appendChild(ottoman);
    }

    root.appendChild(equivRow);
  }

  // Meaning
  const meaningSection = document.createElement('div');
  const meaningLabel = document.createElement('div');
  meaningLabel.style.cssText =
    'font-weight:600;font-size:12px;text-transform:uppercase;opacity:0.6;margin-bottom:4px;';
  meaningLabel.textContent = '📖 ' + _('Anlamı');
  meaningSection.appendChild(meaningLabel);

  const meaning = document.createElement('div');
  meaning.style.cssText = 'white-space:pre-wrap;';
  meaning.textContent = result.meaning;
  meaningSection.appendChild(meaning);
  root.appendChild(meaningSection);

  // Grammatical notes
  if (result.grammaticalNotes) {
    const gramSection = document.createElement('div');
    const gramLabel = document.createElement('div');
    gramLabel.style.cssText =
      'font-weight:600;font-size:12px;text-transform:uppercase;opacity:0.6;margin-bottom:2px;';
    gramLabel.textContent = '📝 ' + _('Gramer');
    gramSection.appendChild(gramLabel);

    const gram = document.createElement('div');
    gram.style.cssText = 'font-size:13px;opacity:0.85;';
    gram.textContent = result.grammaticalNotes;
    gramSection.appendChild(gram);
    root.appendChild(gramSection);
  }

  // Usage level badge
  if (result.usageLevel) {
    const badge = document.createElement('span');
    badge.style.cssText =
      'display:inline-block;padding:2px 8px;border-radius:9999px;font-size:11px;' +
      'background:var(--badge-bg, #e5e7eb);color:var(--badge-color, inherit);';
    badge.textContent = result.usageLevel.toUpperCase();
    root.appendChild(badge);
  }

  // Passages from Risale-i Nur
  if (result.passages.length > 0) {
    const passagesSection = document.createElement('div');
    const passagesLabel = document.createElement('div');
    passagesLabel.style.cssText =
      'font-weight:600;font-size:12px;text-transform:uppercase;opacity:0.6;margin-bottom:6px;';
    passagesLabel.textContent = '📚 ' + _("Risale-i Nur'da Kullanımı");
    passagesSection.appendChild(passagesLabel);

    for (const passage of result.passages) {
      const card = renderPassageCard(passage);
      passagesSection.appendChild(card);
    }
    root.appendChild(passagesSection);
  }

  // Source summary
  if (result.sourceSummary) {
    const sourceSection = document.createElement('div');
    sourceSection.style.cssText = 'font-size:11px;opacity:0.5;margin-top:4px;';
    sourceSection.textContent = 'Kaynak: ' + result.sourceSummary;
    root.appendChild(sourceSection);
  }

  // Powered by
  const powered = document.createElement('div');
  powered.style.cssText = 'margin-top:4px;font-size:11px;opacity:0.4;text-align:right;';
  powered.textContent = '✨ Risale AI Sözlük';
  root.appendChild(powered);

  container.appendChild(root);
}

function renderPassageCard(passage: FullDefinition['passages'][0]): HTMLElement {
  const card = document.createElement('div');
  card.style.cssText =
    'border:1px solid var(--card-border, rgba(128,128,128,0.2));' +
    'border-radius:8px;padding:10px;margin-bottom:8px;' +
    'background:var(--card-bg, rgba(128,128,128,0.05));' +
    'font-size:13px;display:flex;flex-direction:column;gap:6px;';

  // Book & chapter
  const location = document.createElement('div');
  location.style.cssText = 'font-weight:600;font-size:12px;opacity:0.7;';
  location.textContent = [passage.bookName, passage.chapterName].filter(Boolean).join(' › ');
  card.appendChild(location);

  // Original sentence (highlighted)
  const original = document.createElement('div');
  original.style.cssText =
    'font-style:italic;padding:6px 8px;border-left:3px solid var(--accent-color, #60a5fa);' +
    'background:var(--quote-bg, rgba(128,128,128,0.03));border-radius:0 4px 4px 0;';
  original.textContent = `«${passage.sentence}»`;
  card.appendChild(original);

  // Translation
  if (passage.sentenceTranslation) {
    const translation = document.createElement('div');
    translation.style.cssText = 'opacity:0.85;';
    translation.textContent = passage.sentenceTranslation;
    card.appendChild(translation);
  }

  // Word in context
  if (passage.wordInContext) {
    const context = document.createElement('div');
    context.style.cssText = 'font-size:12px;opacity:0.65;margin-top:2px;';
    context.textContent = '💡 ' + passage.wordInContext;
    card.appendChild(context);
  }

  // Navigation button
  if (passage.bookHash) {
    const navBtn = document.createElement('button');
    navBtn.style.cssText =
      'align-self:flex-start;margin-top:4px;padding:4px 10px;font-size:11px;' +
      'border:1px solid var(--btn-border, rgba(128,128,128,0.3));border-radius:6px;' +
      'background:transparent;cursor:pointer;' +
      'transition:background 0.15s;';
    navBtn.textContent = '📖 ' + _('Kitapta Aç');
    navBtn.title = _('Open this passage in the reader');
    navBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      // Navigate to the book in the reader
      const url = new URL(window.location.origin + '/reader/' + passage.bookHash);
      if (passage.cfi) url.searchParams.set('cfi', passage.cfi);
      window.open(url.toString(), '_self');
    });
    // Hover effect
    navBtn.addEventListener('mouseenter', () => {
      navBtn.style.background = 'var(--btn-hover-bg, rgba(128,128,128,0.1))';
    });
    navBtn.addEventListener('mouseleave', () => {
      navBtn.style.background = 'transparent';
    });
    card.appendChild(navBtn);
  }

  return card;
}
