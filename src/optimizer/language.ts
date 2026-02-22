import type { Guest, LanguageLevel } from '../types';

const LEVEL_ORDER: Record<LanguageLevel, number> = {
  basic: 1,
  intermediate: 2,
  fluent: 3,
  native: 4,
};

/**
 * Compute language compatibility score between two guests.
 * +1 if they share a language at fluent+ level
 *  0 if they share a language but one is basic/intermediate
 * -5 if they share no common language at all
 *  0 if either guest has no languages defined (we don't penalize missing data)
 */
export function languageCompatibility(guest1: Guest, guest2: Guest): number {
  if (guest1.languages.length === 0 || guest2.languages.length === 0) {
    return 0;
  }

  let bestSharedLevel = 0;

  for (const l1 of guest1.languages) {
    for (const l2 of guest2.languages) {
      if (l1.language.toLowerCase() === l2.language.toLowerCase()) {
        const minLevel = Math.min(LEVEL_ORDER[l1.level], LEVEL_ORDER[l2.level]);
        bestSharedLevel = Math.max(bestSharedLevel, minLevel);
      }
    }
  }

  if (bestSharedLevel === 0) return -5; // No common language
  if (bestSharedLevel >= LEVEL_ORDER.fluent) return 1; // Both fluent+
  return 0; // Common language but low level
}
