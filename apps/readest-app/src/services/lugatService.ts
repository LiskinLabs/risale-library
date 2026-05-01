import { getAssetPath } from '@/utils/assetPath';

/**
 * Lugat Service for Risale Digital Library
 * Handles multilingual dictionary lookups from metadata.json
 */

export interface DictionaryEntry {
  [term: string]: string;
}

export interface Metadata {
  dictionary: {
    [lang: string]: DictionaryEntry;
  };
}

class LugatService {
  private metadata: Metadata | null = null;
  private loading = false;

  async loadMetadata() {
    if (this.metadata || this.loading) return;
    this.loading = true;
    try {
      const response = await fetch(getAssetPath('/metadata.json'));
      this.metadata = await response.json();
      console.log('Lugat metadata loaded successfully');
    } catch (error) {
      console.error('Failed to load Lugat metadata:', error);
    } finally {
      this.loading = false;
    }
  }

  lookup(word: string, lang: string = 'tr'): string | null {
    if (!this.metadata) return null;

    const dict = this.metadata.dictionary[lang] || this.metadata.dictionary['tr'];
    if (!dict) return null;

    const normalizedWord = word.toLowerCase().trim();

    // 1. Direct match
    if (dict[normalizedWord]) return dict[normalizedWord];

    // 2. Try common Turkish suffixes removal (very basic)
    const stems = [
      normalizedWord,
      normalizedWord.replace(/[ıiueoöü]n[ıiueoöü]$/, ''), // genitive
      normalizedWord.replace(/[ıiueoöü]m[ıiueoöü]$/, ''), // possessive
      normalizedWord.replace(/l[ıiueoöü]r$/, ''), // plural
      normalizedWord.replace(/[ıiueoöü]$/, ''), // accusative
    ];

    for (const stem of stems) {
      if (dict[stem]) return dict[stem];
    }

    return null;
  }
}

export const lugatService = new LugatService();
