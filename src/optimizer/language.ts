import type { Guest } from '../types';

/**
 * Compute language compatibility score between two guests.
 * +1 if they share at least one language
 * -5 if they share no common language
 *  0 if either guest has no languages defined (don't penalize missing data)
 */
export function languageCompatibility(guest1: Guest, guest2: Guest): number {
  if (guest1.languages.length === 0 || guest2.languages.length === 0) {
    return 0;
  }

  const shared = guest1.languages.some((l) => guest2.languages.includes(l));
  return shared ? 1 : -5;
}
