import type { AppState } from '../types';
import { DEFAULT_LANGUAGES } from './reducer';

const STORAGE_KEY = 'mariage-plan-table';

function migrateGuestLanguages(guest: Record<string, unknown>): string[] {
  const langs = guest.languages;
  if (!Array.isArray(langs)) return [];
  return langs.map((l: unknown) => {
    if (typeof l === 'string') return l;
    if (l && typeof l === 'object' && 'language' in l) return (l as { language: string }).language;
    return '';
  }).filter((l: string) => l.length > 0);
}

function migrateState(data: Record<string, unknown>): AppState | null {
  if (!Array.isArray(data.guests) || !Array.isArray(data.affinities) ||
      !Array.isArray(data.couples) || !Array.isArray(data.tables)) {
    return null;
  }
  return {
    guests: data.guests.map((g: Record<string, unknown>) => ({
      id: g.id as string,
      name: g.name as string,
      languages: migrateGuestLanguages(g),
    })),
    affinities: data.affinities as AppState['affinities'],
    couples: data.couples as AppState['couples'],
    tables: data.tables as AppState['tables'],
    assignments: (data.assignments ?? []) as AppState['assignments'],
    languages: Array.isArray(data.languages) ? data.languages as AppState['languages'] : DEFAULT_LANGUAGES,
  };
}

export function saveToLocalStorage(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    console.warn('Failed to save to localStorage');
  }
}

export function loadFromLocalStorage(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return migrateState(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function exportToJson(state: AppState): void {
  const json = JSON.stringify(state, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'plan-de-table.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function importFromJson(json: string): AppState | null {
  try {
    return migrateState(JSON.parse(json));
  } catch {
    return null;
  }
}
