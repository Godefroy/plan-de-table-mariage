import type { AffinityScore } from '../../types';

export const SCORE_CYCLE: AffinityScore[] = [0, 1, 2, 3, -1, -2, -3];

export function getLinkColor(score: number): string {
  if (score === 0) return '#9ca3af';
  if (score > 0) return ['', '#86efac', '#22c55e', '#16a34a'][score];
  return ['', '#fca5a5', '#ef4444', '#dc2626'][-score];
}

export function getBadgeBg(score: number): string {
  if (score === 0) return '#f3f4f6';
  if (score > 0) return `rgba(34, 197, 94, ${0.15 + (score / 3) * 0.45})`;
  return `rgba(239, 68, 68, ${0.15 + (Math.abs(score) / 3) * 0.45})`;
}
