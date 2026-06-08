import { chapterSummarySkill } from './chapterSummary';
import { quoteFinderSkill } from './quoteFinder';
import { kulliyatDeepDiveSkill } from './kulliyatDeepDive';
import { spoilerFreeSkill } from './spoilerFree';
import type { Skill } from '../types';

/** The built-in skills SkillRegistry plants on first boot. */
export const BUILTIN_SKILLS: Skill[] = [
  spoilerFreeSkill,
  chapterSummarySkill,
  quoteFinderSkill,
  kulliyatDeepDiveSkill,
];

export { spoilerFreeSkill, chapterSummarySkill, quoteFinderSkill, kulliyatDeepDiveSkill };
