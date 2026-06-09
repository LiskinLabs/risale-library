/**
 * AI-Powered Dictionary Provider — Context-Aware Risale-i Nur Dictionary
 *
 * Modes:
 *   - word (single word click): contextual definition with Quran/Hadith/Risale references
 *   - passage (text selection): full passage analysis — summary, translation, term extraction
 *
 * Graceful degradation:
 *   AI works → full contextual explanation
 *   AI fails → falls back to Lugat + web sources
 *   No internet → Lugat only (handled by risaleLugatProvider)
 */

import type {
  DictionaryProvider,
  DictionaryLookupContext,
  DictionaryLookupOutcome,
} from '../types';
import { stubTranslation as _ } from '@/utils/misc';
import { useSettingsStore } from '@/store/settingsStore';

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
  'bu',
  'şu',
  'öyle',
  'böyle',
  'şöyle',
  'var',
  'yok',
  'evet',
  'hayır',
  'değil',
  'belki',
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
]);

function isSimpleWord(word: string, lang?: string): boolean {
  const lower = word.trim().toLowerCase();
  if (lower.length <= 3) return true;
  if (lang === 'tr' && SIMPLE_TR_WORDS.has(lower)) return true;
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
const CACHE_TTL = 30 * 60 * 1000;

/** Cache key includes word + language so switching languages busts the cache. */
function cacheKey(word: string, lang: string): string {
  return `${lang}:${word.toLowerCase()}`;
}

// ── Provider ───────────────────────────────────────────────────────────

export const aiDictionaryProvider: DictionaryProvider = {
  id: 'builtin:ai-dictionary',
  kind: 'builtin',
  label: 'Risale AI Sözlük',

  async lookup(word: string, ctx: DictionaryLookupContext): Promise<DictionaryLookupOutcome> {
    const { container, signal, lang, dictionaryLanguage } = ctx;
    const targetLang = dictionaryLanguage || lang || 'ru';
    const sourceLang = lang || 'tr';
    const isPassage = word.trim().split(/\s+/).length > 3;

    // Determine mode: passage analysis for multi-word selections, word mode for single words
    const mode: 'word' | 'passage' = isPassage ? 'passage' : 'word';
    const complexity = isPassage ? 'complex' : isSimpleWord(word, lang) ? 'simple' : 'complex';

    // Simple word (not passage) → fast definition
    if (complexity === 'simple' && mode === 'word') {
      const cached = simpleDefinitionCache.get(cacheKey(word, targetLang));
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        renderSimpleDefinition(container, word, cached.definition, targetLang);
        return { ok: true, headword: word, sourceLabel: 'AI Sözlük' };
      }
      try {
        const definition = await fetchSimpleDefinition(word, targetLang, signal);
        simpleDefinitionCache.set(cacheKey(word, targetLang), { definition, timestamp: Date.now() });
        renderSimpleDefinition(container, word, definition, targetLang);
        return { ok: true, headword: word, sourceLabel: 'AI Sözlük' };
      } catch (err) {
        renderApiError(container, err);
        return { ok: false, reason: 'error', message: 'AI unavailable' };
      }
    }

    // ── Passage mode: full passage analysis ────────────────────────────
    if (mode === 'passage') {
      try {
        const result = await fetchPassageAnalysis(
          word, targetLang, sourceLang, signal, ctx.context,
        );
        renderPassageAnalysis(container, word, result, targetLang);
        return {
          ok: true,
          headword: word.slice(0, 50) + '…',
          sourceLabel: 'Risale AI — Metin Analizi',
        };
      } catch (_err) {
        // Fallback: try word-mode on the first significant word
        const firstWord = word.trim().split(/\s+/)[0] || word;
        try {
          const result = await fetchFullDefinition(
            firstWord, targetLang, sourceLang, signal, ctx.context,
          );
          renderFullDefinition(container, firstWord, result, targetLang);
          return { ok: true, headword: firstWord, sourceLabel: 'Risale AI Sözlük (ilk kelime)' };
        } catch {
          return { ok: false, reason: 'error', message: 'AI passage analysis unavailable' };
        }
      }
    }

    // ── Word mode: contextual definition ──────────────────────────────
    try {
      const result = await fetchFullDefinition(
        word, targetLang, sourceLang, signal, ctx.context,
      );
      renderFullDefinition(container, word, result, targetLang);
      return { ok: true, headword: word, sourceLabel: 'Risale AI Sözlük' };
    } catch (_err) {
      try {
        const definition = await fetchSimpleDefinition(word, targetLang, signal);
        simpleDefinitionCache.set(cacheKey(word, targetLang), { definition, timestamp: Date.now() });
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
  contextualMeaning?: string;
  generalMeaning?: string;
  meaning?: string;
  arabicEquivalent?: string;
  ottomanEquivalent?: string;
  grammaticalNotes?: string;
  quranicReference?: string;
  hadithReference?: string;
  risalePassages: Array<{
    bookName: string;
    bookSlug?: string;
    citation?: string;
    quote?: string;
    quoteTranslation?: string;
    context: string;
    relevance: string;
  }>;
  usageLevel?: string;
  sourceSummary: string;
}

interface PassageAnalysis {
  passageSummary: string;
  approximateTranslation: string;
  contextNote: string;
  complexTerms: Array<{
    term: string;
    contextualDefinition: string;
    generalDefinition: string;
    arabic?: string;
    quranicRef?: string;
    hadithRef?: string;
  }>;
  keyInsight: string;
  sourceSummary: string;
}

function getAiKeys(): Record<string, string> {
  const keys: Record<string, string> = {};
  try {
    const aiSettings = useSettingsStore.getState().settings?.aiSettings;
    if (aiSettings?.['geminiApiKey']) keys['geminiApiKey'] = aiSettings['geminiApiKey'] as string;
    if (aiSettings?.['deepseekApiKey'])
      keys['deepseekApiKey'] = aiSettings['deepseekApiKey'] as string;
  } catch {
    /* store not available */
  }
  return keys;
}

function getAuthHeaders(): Record<string, string> {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchSimpleDefinition(
  word: string,
  targetLang: string,
  signal: AbortSignal,
): Promise<string> {
  const timeout = AbortSignal.timeout(15000);
  const combined = AbortSignal.any([signal, timeout].filter(Boolean));
  const response = await fetch('/api/ai/dictionary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ word, targetLang, complexity: 'simple', ...getAiKeys() }),
    signal: combined,
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  const data = await response.json();
  if (!data.ok) throw new Error(data.error || 'Unknown error');
  return data.definition || word;
}

async function fetchFullDefinition(
  word: string,
  targetLang: string,
  sourceLang: string,
  signal: AbortSignal,
  context?: { before?: string; after?: string },
): Promise<FullDefinition> {
  const timeout = AbortSignal.timeout(25000);
  const combined = AbortSignal.any([signal, timeout].filter(Boolean));
  const response = await fetch('/api/ai/dictionary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({
      word,
      targetLang,
      sourceLang,
      complexity: 'complex',
      mode: 'word',
      context: context || undefined,
      ...getAiKeys(),
    }),
    signal: combined,
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  const data = await response.json();
  if (!data.ok) throw new Error(data.error || 'Unknown error');
  return parseJsonResponse(data.json, word);
}

async function fetchPassageAnalysis(
  text: string,
  targetLang: string,
  sourceLang: string,
  signal: AbortSignal,
  context?: { before?: string; after?: string },
): Promise<PassageAnalysis> {
  const timeout = AbortSignal.timeout(35000);
  const combined = AbortSignal.any([signal, timeout].filter(Boolean));
  const response = await fetch('/api/ai/dictionary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({
      word: text,
      targetLang,
      sourceLang,
      complexity: 'complex',
      mode: 'passage',
      context: context || undefined,
      ...getAiKeys(),
    }),
    signal: combined,
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  const data = await response.json();
  if (!data.ok) throw new Error(data.error || 'Unknown error');
  return parsePassageJsonResponse(data.json, text);
}

function parseJsonResponse(jsonStr: string, fallbackWord: string): FullDefinition {
  let cleaned = jsonStr.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  try {
    const parsed = JSON.parse(cleaned);
    return {
      headword: parsed.headword || fallbackWord,
      contextualMeaning: parsed.contextualMeaning,
      generalMeaning: parsed.generalMeaning,
      meaning: parsed.meaning,
      arabicEquivalent: parsed.arabic_equivalent || parsed.arabicEquivalent,
      ottomanEquivalent: parsed.ottoman_equivalent || parsed.ottomanEquivalent,
      grammaticalNotes: parsed.grammatical_notes || parsed.grammaticalNotes,
      quranicReference: parsed.quranicReference || parsed.quranic_reference,
      hadithReference: parsed.hadithReference || parsed.hadith_reference,
      risalePassages: Array.isArray(parsed.risalePassages)
        ? parsed.risalePassages.map((p: Record<string, unknown>) => ({
            bookName: (p['bookName'] as string) || (p['book_name'] as string) || '',
            bookSlug: (p['bookSlug'] as string) || (p['book_slug'] as string) || undefined,
            citation: (p['citation'] as string) || undefined,
            quote: (p['quote'] as string) || undefined,
            quoteTranslation:
              (p['quoteTranslation'] as string) ||
              (p['quote_translation'] as string) ||
              undefined,
            context: (p['context'] as string) || '',
            relevance: (p['relevance'] as string) || '',
          }))
        : [],
      usageLevel: parsed.usage_level || parsed.usageLevel,
      sourceSummary: parsed.sourceSummary || parsed.source_summary || '',
    };
  } catch {
    return { headword: fallbackWord, meaning: jsonStr, risalePassages: [], sourceSummary: '' };
  }
}

function parsePassageJsonResponse(jsonStr: string, _fallbackText: string): PassageAnalysis {
  let cleaned = jsonStr.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  try {
    const parsed = JSON.parse(cleaned);
    return {
      passageSummary: parsed.passageSummary || '',
      approximateTranslation: parsed.approximateTranslation || '',
      contextNote: parsed.contextNote || '',
      complexTerms: Array.isArray(parsed.complexTerms)
        ? parsed.complexTerms.map(
            (t: Record<string, unknown>): PassageAnalysis['complexTerms'][0] => ({
              term: (t['term'] as string) || '',
              contextualDefinition: (t['contextualDefinition'] as string) || '',
              generalDefinition: (t['generalDefinition'] as string) || '',
              arabic: (t['arabic'] as string) || undefined,
              quranicRef: (t['quranicRef'] as string) || undefined,
              hadithRef: (t['hadithRef'] as string) || undefined,
            }),
          )
        : [],
      keyInsight: parsed.keyInsight || '',
      sourceSummary: parsed.sourceSummary || parsed.source_summary || '',
    };
  } catch {
    return {
      passageSummary: '',
      approximateTranslation: '',
      contextNote: '',
      complexTerms: [],
      keyInsight: '',
      sourceSummary: jsonStr.slice(0, 200),
    };
  }
}

// ── Rendering: Simple definition ───────────────────────────────────────

function renderSimpleDefinition(
  container: HTMLElement,
  word: string,
  definition: string,
  _targetLang: string,
): void {
  container.innerHTML = '';
  const root = document.createElement('div');
  root.setAttribute('data-ai-result', 'simple');
  root.style.cssText = 'font-size:14px;line-height:1.6;padding:4px 0;';
  root.innerHTML = `
    <div style="font-weight:600;font-size:16px;margin-bottom:8px;">${escapeHtml(word)}</div>
    <div style="color:var(--text-secondary, inherit);">${escapeHtml(definition)}</div>
  `;
  root.appendChild(saveButtonEl(container, word));
  root.appendChild(refreshButtonEl());
  root.appendChild(poweredByEl());
  container.appendChild(root);
}

// ── Rendering: Full definition ─────────────────────────────────────────

function renderFullDefinition(
  container: HTMLElement,
  word: string,
  result: FullDefinition,
  _targetLang: string,
): void {
  container.innerHTML = '';
  const root = document.createElement('div');
  root.setAttribute('data-ai-result', 'full');
  root.style.cssText =
    'font-size:14px;line-height:1.7;padding:4px 0;display:flex;flex-direction:column;gap:10px;';

  // Headword
  root.appendChild(headerEl('', result.headword || word, 'font-weight:700;font-size:17px;'));

  // Arabic / Ottoman
  if (result.arabicEquivalent || result.ottomanEquivalent) {
    const row = rowEl();
    if (result.arabicEquivalent) {
      const a = document.createElement('span');
      a.style.cssText =
        'font-family:"Traditional Arabic","Scheherazade New",serif;font-size:18px;direction:rtl;';
      a.textContent = result.arabicEquivalent;
      row.appendChild(a);
    }
    if (result.ottomanEquivalent) {
      const o = document.createElement('span');
      o.style.cssText = 'opacity:0.7;font-style:italic;margin-left:12px;';
      o.textContent = `(${result.ottomanEquivalent})`;
      row.appendChild(o);
    }
    root.appendChild(row);
  }

  // Contextual meaning (most important!)
  if (result.contextualMeaning) {
    root.appendChild(sectionEl('📍 ' + _('Bu Bağlamda'), result.contextualMeaning));
  }

  // General meaning
  const general = result.generalMeaning || result.meaning;
  if (general) {
    root.appendChild(sectionEl('📖 ' + _('Genel Anlamı'), general));
  } else if (!result.contextualMeaning && result.meaning) {
    root.appendChild(sectionEl('📖 ' + _('Anlamı'), result.meaning));
  }

  // Quranic reference
  if (result.quranicReference) {
    root.appendChild(sectionEl('☪️ ' + _("Kur'an"), result.quranicReference, 'color:#2d7d46;'));
  }

  // Hadith reference
  if (result.hadithReference) {
    root.appendChild(sectionEl('🕌 ' + _('Hadis'), result.hadithReference, 'color:#7d5e2d;'));
  }

  // Risale passages
  if (result.risalePassages.length > 0) {
    const ps = document.createElement('div');
    ps.appendChild(labelEl('📚 ' + _("Risale-i Nur'da")));
    for (const p of result.risalePassages) {
      ps.appendChild(passageCard(p));
    }
    root.appendChild(ps);
  }

  // Grammar notes
  if (result.grammaticalNotes) {
    root.appendChild(sectionEl('📝 ' + _('Gramer'), result.grammaticalNotes));
  }

  // Usage level badge
  if (result.usageLevel) {
    const badge = document.createElement('span');
    badge.style.cssText =
      'display:inline-block;padding:2px 8px;border-radius:9999px;font-size:11px;background:var(--badge-bg,#e5e7eb);color:var(--badge-color,inherit);align-self:flex-start;';
    badge.textContent = result.usageLevel.toUpperCase();
    root.appendChild(badge);
  }

  // Source
  if (result.sourceSummary) {
    const src = document.createElement('div');
    src.style.cssText = 'font-size:11px;opacity:0.5;margin-top:4px;';
    src.textContent = '📎 ' + result.sourceSummary;
    root.appendChild(src);
  }

  // Save button
  root.appendChild(saveButtonEl(container, word));
  root.appendChild(refreshButtonEl());
  // Powered by
  root.appendChild(poweredByEl());
  container.appendChild(root);
}

// ── Rendering: Passage analysis ────────────────────────────────────────

function renderPassageAnalysis(
  container: HTMLElement,
  originalText: string,
  result: PassageAnalysis,
  _targetLang: string,
): void {
  container.innerHTML = '';
  const root = document.createElement('div');
  root.setAttribute('data-ai-result', 'passage');
  root.style.cssText =
    'font-size:14px;line-height:1.7;padding:4px 0;display:flex;flex-direction:column;gap:12px;';

  // Original text (highlighted)
  const origBox = document.createElement('div');
  origBox.style.cssText =
    'font-style:italic;padding:10px 12px;border-left:3px solid var(--accent-color, #8b191b);background:var(--quote-bg, rgba(128,128,128,0.05));border-radius:0 6px 6px 0;font-size:15px;';
  origBox.textContent = `«${originalText.slice(0, 300)}${originalText.length > 300 ? '…' : ''}»`;
  root.appendChild(origBox);

  // Passage summary
  if (result.passageSummary) {
    root.appendChild(sectionEl('📋 ' + _('Özet'), result.passageSummary));
  }

  // Translation
  if (result.approximateTranslation) {
    root.appendChild(
      sectionEl(
        '🌐 ' + _('Tercüme'),
        result.approximateTranslation,
        'color:var(--text-secondary, inherit);',
      ),
    );
  }

  // Context note
  if (result.contextNote) {
    root.appendChild(sectionEl('🔗 ' + _('Bağlam'), result.contextNote));
  }

  // Complex terms
  if (result.complexTerms.length > 0) {
    const termsDiv = document.createElement('div');
    termsDiv.appendChild(labelEl('📖 ' + _('Terimler')));
    for (const t of result.complexTerms) {
      termsDiv.appendChild(termCard(t));
    }
    root.appendChild(termsDiv);
  }

  // Key insight
  if (result.keyInsight) {
    root.appendChild(sectionEl('💡 ' + _('Ana Fikir'), result.keyInsight, 'font-weight:600;'));
  }

  // Source
  if (result.sourceSummary) {
    const src = document.createElement('div');
    src.style.cssText = 'font-size:11px;opacity:0.5;margin-top:4px;';
    src.textContent = '📎 ' + result.sourceSummary;
    root.appendChild(src);
  }

  root.appendChild(saveButtonEl(container, originalText.slice(0, 50)));
  root.appendChild(refreshButtonEl());
  root.appendChild(poweredByEl());
  container.appendChild(root);
}

// ── Rendering: Error ───────────────────────────────────────────────────

function renderApiError(container: HTMLElement, error: unknown): void {
  container.innerHTML = '';
  const msg = error instanceof Error ? error.message : String(error);
  container.innerHTML = `
    <div style="padding:12px;font-size:13px;line-height:1.5;color:var(--text-muted,inherit);text-align:center;">
      <div style="font-size:28px;margin-bottom:8px;">⚠️</div>
      <div style="font-weight:600;margin-bottom:4px;">AI Sözlük — Hata</div>
      <div style="font-size:11px;opacity:0.6;word-break:break-all;">${escapeHtml(msg)}</div>
      <div style="font-size:11px;opacity:0.5;margin-top:4px;">Diğer sözlükler aşağıda gösteriliyor</div>
    </div>
  `;
}

// ── DOM helpers ────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function headerEl(_icon: string, text: string, extraCss = ''): HTMLElement {
  const el = document.createElement('div');
  el.style.cssText = extraCss;
  el.textContent = text;
  return el;
}

function labelEl(text: string): HTMLElement {
  const el = document.createElement('div');
  el.style.cssText =
    'font-weight:600;font-size:12px;text-transform:uppercase;opacity:0.6;margin-bottom:4px;';
  el.textContent = text;
  return el;
}

function sectionEl(label: string, text: string, extraCss = ''): HTMLElement {
  const div = document.createElement('div');
  div.appendChild(labelEl(label));
  const p = document.createElement('div');
  p.style.cssText = `white-space:pre-wrap;${extraCss}`;
  p.textContent = text;
  div.appendChild(p);
  return div;
}

function rowEl(): HTMLElement {
  const el = document.createElement('div');
  el.style.cssText = 'display:flex;gap:16px;flex-wrap:wrap;font-size:13px;';
  return el;
}

function passageCard(p: FullDefinition['risalePassages'][0]): HTMLElement {
  const card = document.createElement('div');
  card.style.cssText =
    'border:1px solid var(--card-border,rgba(128,128,128,0.2));border-radius:8px;padding:10px;margin-bottom:6px;background:var(--card-bg,rgba(128,128,128,0.05));font-size:13px;';
  const hasQuote = p.quote && p.quote.trim().length > 0;
  const hasTranslation = p.quoteTranslation && p.quoteTranslation.trim().length > 0;
  const hasBookLink = p.bookSlug && p.quote;

  // Build a clickable link that dispatches a navigation event
  const bookLinkAttrs = hasBookLink
    ? `data-risale-book="${escapeHtml(p.bookSlug!)}" data-risale-search="${escapeHtml(p.quote!.slice(0, 80))}" class="risale-quote-link" style="cursor:pointer;text-decoration:underline;text-decoration-style:dotted;text-underline-offset:3px;" title="Нажмите чтобы открыть книгу на этой цитате"`
    : '';

  card.innerHTML = `
    <div style="font-weight:600;font-size:12px;opacity:0.7;">📗 ${escapeHtml(p.bookName)}${p.citation ? ` <span style="opacity:0.5;font-weight:400;">— ${escapeHtml(p.citation)}</span>` : ''}</div>
    ${hasQuote ? `<blockquote ${bookLinkAttrs} style="margin:6px 0 4px 0;padding:6px 8px;border-left:3px solid var(--accent-color,#8b191b);background:var(--quote-bg,rgba(128,128,128,0.05));border-radius:0 4px 4px 0;font-style:italic;line-height:1.5;">${escapeHtml(p.quote!)}</blockquote>` : ''}
    ${hasTranslation ? `<div style="margin:4px 0;font-size:12px;opacity:0.85;line-height:1.5;">${escapeHtml(p.quoteTranslation!)}</div>` : ''}
    <div style="margin-top:4px;">${escapeHtml(p.context)}</div>
    ${p.relevance ? `<div style="margin-top:4px;font-size:12px;opacity:0.7;">🔗 ${escapeHtml(p.relevance)}</div>` : ''}
  `;

  // Add click handler for navigation
  if (hasBookLink) {
    const quote = card.querySelector('.risale-quote-link');
    quote?.addEventListener('click', (e) => {
      e.stopPropagation();
      const bookSlug = (e.currentTarget as HTMLElement).dataset['risaleBook'] || '';
      const searchQuery = (e.currentTarget as HTMLElement).dataset['risaleSearch'] || '';
      if (bookSlug && searchQuery) {
        window.dispatchEvent(
          new CustomEvent('risale:navigate-to-quote', {
            detail: { bookSlug, searchQuery },
          }),
        );
      }
    });
  }

  return card;
}

function termCard(t: PassageAnalysis['complexTerms'][0]): HTMLElement {
  const card = document.createElement('div');
  card.style.cssText =
    'border:1px solid var(--card-border,rgba(128,128,128,0.2));border-radius:8px;padding:10px;margin-bottom:6px;background:var(--card-bg,rgba(128,128,128,0.05));font-size:13px;';
  let html = `<div style="font-weight:700;font-size:14px;">${escapeHtml(t.term)}`;
  if (t.arabic)
    html += ` <span style="font-family:'Traditional Arabic',serif;font-size:16px;direction:rtl;">${escapeHtml(t.arabic)}</span>`;
  html += `</div>`;
  html += `<div style="margin-top:4px;"><span style="opacity:0.6;">Bağlamda:</span> ${escapeHtml(t.contextualDefinition)}</div>`;
  html += `<div style="margin-top:2px;"><span style="opacity:0.6;">Genel:</span> ${escapeHtml(t.generalDefinition)}</div>`;
  if (t.quranicRef)
    html += `<div style="margin-top:2px;color:#2d7d46;">☪️ ${escapeHtml(t.quranicRef)}</div>`;
  if (t.hadithRef)
    html += `<div style="margin-top:2px;color:#7d5e2d;">🕌 ${escapeHtml(t.hadithRef)}</div>`;
  card.innerHTML = html;
  return card;
}

function poweredByEl(): HTMLElement {
  const el = document.createElement('div');
  el.style.cssText = 'margin-top:4px;font-size:11px;opacity:0.4;text-align:right;';
  el.textContent = '✨ Risale AI Sözlük';
  return el;
}

function refreshButtonEl(): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'margin-top:6px;display:flex;align-items:center;gap:6px;';
  const btn = document.createElement('button');
  btn.style.cssText =
    'display:inline-flex;align-items:center;gap:3px;padding:3px 10px;' +
    'font-size:11px;border:1px solid var(--btn-border,rgba(128,128,128,0.25));' +
    'border-radius:4px;background:transparent;cursor:pointer;' +
    'color:var(--text-secondary,inherit);';
  btn.textContent = '🔄 ' + _('Yenile');
  btn.title = _('Refresh AI response');
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('risale:refresh-ai-dictionary'));
    btn.textContent = '⏳ ' + _('Yenileniyor...');
    btn.style.opacity = '0.6';
    setTimeout(() => {
      btn.textContent = '🔄 ' + _('Yenile');
      btn.style.opacity = '1';
    }, 3000);
  });
  const hint = document.createElement('span');
  hint.style.cssText = 'font-size:10px;opacity:0.35;';
  hint.textContent = _('If the AI response looks wrong, try refreshing.');
  wrapper.appendChild(btn);
  wrapper.appendChild(hint);
  return wrapper;
}

function saveButtonEl(container: HTMLElement, word: string): HTMLElement {
  const btn = document.createElement('button');
  btn.style.cssText =
    'display:inline-flex;align-items:center;gap:4px;margin-top:8px;padding:5px 12px;' +
    'font-size:12px;border:1px solid var(--btn-border,rgba(128,128,128,0.3));' +
    'border-radius:6px;background:transparent;cursor:pointer;' +
    'transition:background 0.15s;color:var(--text-secondary,inherit);';
  btn.textContent = '📝 ' + _('Notlara Kaydet');
  btn.title = _('Save AI response as a note');
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    // Get the full rendered HTML of the parent card (all content above the button)
    const parent = btn.closest('[data-ai-result]') || container;
    const html = parent.innerHTML;
    // Dispatch custom event for the note-saving hook to pick up
    window.dispatchEvent(
      new CustomEvent('risale:save-ai-note', {
        detail: { word, html, timestamp: Date.now() },
      }),
    );
    // Visual feedback
    btn.textContent = '✅ ' + _('Kaydedildi');
    btn.style.background = 'var(--badge-bg, #e5e7eb)';
    setTimeout(() => {
      btn.textContent = '📝 ' + _('Notlara Kaydet');
      btn.style.background = 'transparent';
    }, 2000);
  });
  // Hover effect
  btn.addEventListener('mouseenter', () => {
    btn.style.background = 'var(--btn-hover-bg, rgba(128,128,128,0.1))';
  });
  btn.addEventListener('mouseleave', () => {
    if (btn.textContent?.startsWith('📝')) btn.style.background = 'transparent';
  });
  return btn;
}
