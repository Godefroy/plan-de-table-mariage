import type { AppState } from '../types';

const STORAGE_KEY = 'mariage-plan-table';

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
    return JSON.parse(raw) as AppState;
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
    const data = JSON.parse(json);
    if (
      Array.isArray(data.guests) &&
      Array.isArray(data.affinities) &&
      Array.isArray(data.couples) &&
      Array.isArray(data.tables)
    ) {
      return {
        guests: data.guests,
        affinities: data.affinities,
        couples: data.couples,
        tables: data.tables,
        assignments: data.assignments ?? [],
      } as AppState;
    }
    return null;
  } catch {
    return null;
  }
}
