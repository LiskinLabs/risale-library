import type { Transformer } from './types';
import { footnoteTransformer } from './footnote';
import { languageTransformer } from './language';
import { punctuationTransformer } from './punctuation';
import { whitespaceTransformer } from './whitespace';
import { sanitizerTransformer } from './sanitizer';
import { simpleccTransformer } from './simplecc';
import { styleTransformer } from './style';
import { proofreadTransformer } from './proofread';
import { warichuTransformer } from './warichu';
import { hasiyeTransformer } from './hasiye';
import { uiEffectsTransformer } from './uiEffects';

export const availableTransformers: Transformer[] = [
  punctuationTransformer,
  footnoteTransformer,
  hasiyeTransformer,
  uiEffectsTransformer,
  languageTransformer,
  styleTransformer,
  whitespaceTransformer,
  sanitizerTransformer,
  simpleccTransformer,
  proofreadTransformer,
  warichuTransformer,
  // Add more transformers here
];
