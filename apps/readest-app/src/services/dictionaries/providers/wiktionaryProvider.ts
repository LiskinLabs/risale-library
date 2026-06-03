/**
 * Built-in Wiktionary provider.
 *
 * Looks up the headword in en.wiktionary.org's REST API. For CJK headwords
 * (lang code starts with `zh`/`zho`), falls back to {@link fetchChineseDefinition}
 * which scrapes Wiktionary's wikitext for pinyin + meanings.
 *
 * In-popup link interception: any `a[rel="mw:WikiLink"]` in a definition is
 * rewritten to call `ctx.onNavigate(title)` instead of navigating away. The
 * shell uses this to push onto the per-tab history.
 *
 * Extracted from the legacy `WiktionaryPopup.tsx`. The fetch + DOM-build
 * code is functionally identical; the only change is writing into
 * `ctx.container` instead of a global `<main>` element so the renderer can
 * coexist with other tabs in the same popup.
 */
import type { DictionaryProvider, DictionaryLookupOutcome } from '../types';
import { BUILTIN_PROVIDER_IDS } from '../types';
import { fetchChineseDefinition } from '../chineseDict';
import { normalizedLangCode } from '@/utils/lang';
import { stubTranslation as _ } from '@/utils/misc';
import { dictCache, DictCache } from '../dictCache';

type Definition = {
  definition: string;
  examples?: string[];
};

type Result = {
  partOfSpeech: string;
  definitions: Definition[];
  language: string;
};

const applyDictLinks = (container: HTMLElement, onNavigate?: (word: string) => void): void => {
  const links = container.querySelectorAll<HTMLAnchorElement>('a[rel="mw:WikiLink"]');
  links.forEach((link) => {
    const title = link.getAttribute('title');
    if (!title) return;
    link.addEventListener('click', (event) => {
      event.preventDefault();
      onNavigate?.(title);
    });
    link.className = 'not-eink:text-primary underline cursor-pointer';
  });
};

const renderChinese = async (
  word: string,
  container: HTMLElement,
  signal: AbortSignal,
): Promise<DictionaryLookupOutcome> => {
  const entry = await fetchChineseDefinition(word);
  if (signal.aborted) return { ok: false, reason: 'error', message: 'aborted' };
  if (!entry) return { ok: false, reason: 'empty' };

  const hgroup = document.createElement('hgroup');
  const h1 = document.createElement('h1');
  h1.textContent = entry.word;
  h1.className = 'text-lg font-bold';
  hgroup.append(h1);

  if (entry.pinyin) {
    const pinyinEl = document.createElement('p');
    pinyinEl.textContent = entry.pinyin;
    pinyinEl.className = 'text-base italic not-eink:opacity-85';
    hgroup.append(pinyinEl);
  }

  const langEl = document.createElement('p');
  langEl.textContent = 'Chinese';
  langEl.className = 'text-sm italic not-eink:opacity-75';
  hgroup.append(langEl);
  container.append(hgroup);

  entry.definitions.forEach(({ partOfSpeech, meanings }) => {
    const h2 = document.createElement('h2');
    h2.textContent = partOfSpeech;
    h2.className = 'text-base font-semibold mt-4';
    const ol = document.createElement('ol');
    ol.className = 'pl-8 list-decimal';
    meanings.forEach((meaning) => {
      const li = document.createElement('li');
      li.textContent = meaning;
      ol.appendChild(li);
    });
    container.appendChild(h2);
    container.appendChild(ol);
  });

  return { ok: true, headword: entry.word, sourceLabel: 'Wiktionary (CC BY-SA)' };
};

const renderWiktionary = async (
  word: string,
  language: string | undefined,
  preferredLanguage: string | undefined,
  container: HTMLElement,
  signal: AbortSignal,
  onNavigate?: (word: string) => void,
): Promise<DictionaryLookupOutcome> => {
  const dictLang = preferredLanguage || 'en';

  // Try the user's preferred language edition first, fall back to English.
  // Not all language editions have the REST API, so we attempt the preferred
  // one and gracefully degrade.
  const urls = [
    `https://${dictLang}.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`,
    ...(dictLang !== 'en'
      ? [`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`]
      : []),
  ];

  let json: Record<string, Result[]>;
  let usedLang = 'en';
  let lastError: string | undefined;

  for (const url of urls) {
    try {
      const response = await fetch(url, { signal });
      if (response.ok) {
        json = await response.json();
        usedLang = new URL(url).hostname.split('.')[0]!;
        lastError = undefined;
        break;
      }
      if (response.status === 404) {
        lastError = `404 (${new URL(url).hostname})`;
        continue; // try fallback
      }
      lastError = `HTTP ${response.status}`;
      if (url === urls[urls.length - 1]) {
        return { ok: false, reason: 'error', message: lastError };
      }
    } catch (err) {
      if ((err as { name?: string }).name === 'AbortError') throw err;
      lastError = (err as Error).message;
    }
  }

  if (lastError || !json!) {
    return { ok: false, reason: 'error', message: lastError || 'No response' };
  }

  if (signal.aborted) return { ok: false, reason: 'error', message: 'aborted' };

  const sourceLabel =
    usedLang === 'en' ? 'Wiktionary (CC BY-SA)' : `Wiktionary (${usedLang}, CC BY-SA)`;

  // Multilingual fallback: try the book's language section first,
  // then the user's preferred UI language, then English, then first available.
  const langKeys = [
    ...(language ? [language] : []),
    ...(preferredLanguage && language !== preferredLanguage ? [preferredLanguage] : []),
    ...(language !== 'en' && preferredLanguage !== 'en' ? ['en'] : []),
  ];
  let results: Result[] | undefined;
  for (const key of langKeys) {
    const section = json[key];
    if (section && section.length > 0) {
      results = section;
      break;
    }
  }
  if (!results) {
    // Last resort: pick the first available language section
    const firstKey = Object.keys(json)[0];
    results = firstKey ? json[firstKey] : undefined;
  }

  if (!results || results.length === 0) {
    return { ok: false, reason: 'empty' };
  }

  const hgroup = document.createElement('hgroup');
  const h1 = document.createElement('h1');
  h1.textContent = word;
  h1.className = 'text-lg font-bold';
  const p = document.createElement('p');
  p.textContent = results[0]!.language;
  p.className = 'text-sm italic not-eink:opacity-75';
  hgroup.append(h1, p);
  container.append(hgroup);

  results.forEach(({ partOfSpeech, definitions }: Result) => {
    const h2 = document.createElement('h2');
    h2.textContent = partOfSpeech;
    h2.className = 'text-base font-semibold mt-4';
    const ol = document.createElement('ol');
    ol.className = 'pl-8 list-decimal';
    definitions.forEach(({ definition, examples }: Definition) => {
      if (!definition) return;
      const li = document.createElement('li');
      li.innerHTML = definition;
      if (examples) {
        const ul = document.createElement('ul');
        ul.className = 'pl-8 list-disc text-sm italic not-eink:opacity-75';
        examples.forEach((example) => {
          const exampleLi = document.createElement('li');
          exampleLi.innerHTML = example;
          ul.appendChild(exampleLi);
        });
        li.appendChild(ul);
      }
      ol.appendChild(li);
    });
    container.appendChild(h2);
    container.appendChild(ol);
  });

  applyDictLinks(container, onNavigate);

  return { ok: true, headword: word, sourceLabel };
};

export const wiktionaryProvider: DictionaryProvider = {
  id: BUILTIN_PROVIDER_IDS.wiktionary,
  kind: 'builtin',
  label: _('Wiktionary'),
  async lookup(word, ctx) {
    const langCode = typeof ctx.lang === 'string' ? ctx.lang : ctx.lang?.[0];
    const isChinese = langCode ? normalizedLangCode(langCode) === 'zh' : false;

    // Check cache first
    const cacheKey = DictCache.key(BUILTIN_PROVIDER_IDS.wiktionary, word, ctx.dictionaryLanguage);
    const cached = dictCache.get(cacheKey);
    if (cached && !ctx.signal.aborted) {
      ctx.container.innerHTML = cached.html;
      applyDictLinks(ctx.container, ctx.onNavigate);
      return { ok: true, headword: word, sourceLabel: cached.sourceLabel };
    }

    try {
      let outcome: DictionaryLookupOutcome;
      if (isChinese) {
        outcome = await renderChinese(word, ctx.container, ctx.signal);
      } else {
        outcome = await renderWiktionary(
          word,
          langCode,
          ctx.dictionaryLanguage,
          ctx.container,
          ctx.signal,
          ctx.onNavigate,
        );
      }
      // Cache successful lookups
      if (outcome.ok) {
        dictCache.set(cacheKey, ctx.container.innerHTML, outcome.sourceLabel || 'Wiktionary');
      }
      return outcome;
    } catch (error) {
      if ((error as { name?: string }).name === 'AbortError') {
        return { ok: false, reason: 'error', message: 'aborted' };
      }
      console.error('Wiktionary lookup failed', error);
      return {
        ok: false,
        reason: 'error',
        message: error instanceof Error ? error.message : String(error),
      };
    }
  },
};
