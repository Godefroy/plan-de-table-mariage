import type { AppState } from '../types';
import type { AppAction } from './actions';

function normalizeIds(id1: string, id2: string): [string, string] {
  return id1 < id2 ? [id1, id2] : [id2, id1];
}

export const DEFAULT_LANGUAGES = [
  { name: 'Français', flag: '🇫🇷' },
  { name: 'English', flag: '🇬🇧' },
];

export const defaultState: AppState = {
  guests: [],
  affinities: [],
  couples: [],
  tables: [],
  assignments: [],
  languages: DEFAULT_LANGUAGES,
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_GUEST': {
      const newGuest = {
        id: action.payload.id ?? crypto.randomUUID(),
        name: action.payload.name,
        languages: [],
      };
      return { ...state, guests: [...state.guests, newGuest] };
    }

    case 'UPDATE_GUEST': {
      return {
        ...state,
        guests: state.guests.map((g) =>
          g.id === action.payload.id ? { ...g, name: action.payload.name } : g
        ),
      };
    }

    case 'REMOVE_GUEST': {
      const id = action.payload.id;
      return {
        ...state,
        guests: state.guests.filter((g) => g.id !== id),
        affinities: state.affinities.filter(
          (a) => a.guestId1 !== id && a.guestId2 !== id
        ),
        couples: state.couples.filter(
          (c) => c.guestId1 !== id && c.guestId2 !== id
        ),
        assignments: state.assignments.filter((a) => a.guestId !== id),
      };
    }

    case 'SET_GUEST_LANGUAGES': {
      return {
        ...state,
        guests: state.guests.map((g) =>
          g.id === action.payload.id
            ? { ...g, languages: action.payload.languages }
            : g
        ),
      };
    }

    case 'SET_AFFINITY': {
      const [gId1, gId2] = normalizeIds(
        action.payload.guestId1,
        action.payload.guestId2
      );
      const existing = state.affinities.findIndex(
        (a) => a.guestId1 === gId1 && a.guestId2 === gId2
      );
      let affinities;
      if (action.payload.score === 0) {
        // Remove the pair if score is 0
        affinities = state.affinities.filter(
          (a) => !(a.guestId1 === gId1 && a.guestId2 === gId2)
        );
      } else if (existing >= 0) {
        affinities = state.affinities.map((a, i) =>
          i === existing
            ? { guestId1: gId1, guestId2: gId2, score: action.payload.score }
            : a
        );
      } else {
        affinities = [
          ...state.affinities,
          { guestId1: gId1, guestId2: gId2, score: action.payload.score },
        ];
      }
      return { ...state, affinities };
    }

    case 'REMOVE_AFFINITY': {
      const [gId1, gId2] = normalizeIds(
        action.payload.guestId1,
        action.payload.guestId2
      );
      return {
        ...state,
        affinities: state.affinities.filter(
          (a) => !(a.guestId1 === gId1 && a.guestId2 === gId2)
        ),
      };
    }

    case 'ADD_COUPLE': {
      const [gId1, gId2] = normalizeIds(
        action.payload.guestId1,
        action.payload.guestId2
      );
      const exists = state.couples.some(
        (c) => {
          const [cId1, cId2] = normalizeIds(c.guestId1, c.guestId2);
          return cId1 === gId1 && cId2 === gId2;
        }
      );
      if (exists) return state;
      return {
        ...state,
        couples: [...state.couples, { guestId1: gId1, guestId2: gId2 }],
      };
    }

    case 'REMOVE_COUPLE': {
      const [gId1, gId2] = normalizeIds(
        action.payload.guestId1,
        action.payload.guestId2
      );
      return {
        ...state,
        couples: state.couples.filter((c) => {
          const [cId1, cId2] = normalizeIds(c.guestId1, c.guestId2);
          return !(cId1 === gId1 && cId2 === gId2);
        }),
      };
    }

    case 'ADD_TABLE': {
      const newTable = {
        id: crypto.randomUUID(),
        name: action.payload.name,
        shape: action.payload.shape,
        seats: action.payload.seats,
        customSides: action.payload.customSides,
      };
      return { ...state, tables: [...state.tables, newTable] };
    }

    case 'UPDATE_TABLE': {
      const { id, seats } = action.payload;
      return {
        ...state,
        tables: state.tables.map((t) =>
          t.id === id
            ? {
                ...t,
                name: action.payload.name,
                shape: action.payload.shape,
                seats: action.payload.seats,
                customSides: action.payload.customSides,
              }
            : t
        ),
        assignments: state.assignments.filter(
          (a) => a.tableId !== id || a.seatIndex < seats
        ),
      };
    }

    case 'REMOVE_TABLE': {
      return {
        ...state,
        tables: state.tables.filter((t) => t.id !== action.payload.id),
        assignments: state.assignments.filter((a) => a.tableId !== action.payload.id),
      };
    }

    case 'SET_ASSIGNMENTS': {
      return { ...state, assignments: action.payload };
    }

    case 'CLEAR_ASSIGNMENTS': {
      return { ...state, assignments: [] };
    }

    case 'TOGGLE_LOCK': {
      const { tableId, seatIndex } = action.payload;
      return {
        ...state,
        assignments: state.assignments.map((a) =>
          a.tableId === tableId && a.seatIndex === seatIndex
            ? { ...a, locked: !a.locked }
            : a
        ),
      };
    }

    case 'SWAP_GUESTS': {
      const { tableId, seatIndex, otherGuestId } = action.payload;
      const target = state.assignments.find(
        (a) => a.tableId === tableId && a.seatIndex === seatIndex
      );
      const other = state.assignments.find((a) => a.guestId === otherGuestId);
      if (!target || !other) return state;
      if (target.guestId === otherGuestId) return state;

      const targetTable = target.tableId;
      const targetSeat = target.seatIndex;
      const otherTable = other.tableId;
      const otherSeat = other.seatIndex;

      return {
        ...state,
        assignments: state.assignments.map((a) => {
          if (a.guestId === target.guestId) {
            return { ...a, tableId: otherTable, seatIndex: otherSeat, locked: false };
          }
          if (a.guestId === otherGuestId) {
            return { ...a, tableId: targetTable, seatIndex: targetSeat, locked: true };
          }
          return a;
        }),
      };
    }

    case 'ADD_LANGUAGE': {
      const exists = state.languages.some(
        (l) => l.name.toLowerCase() === action.payload.name.toLowerCase()
      );
      if (exists) return state;
      return { ...state, languages: [...state.languages, action.payload] };
    }

    case 'REMOVE_LANGUAGE': {
      const langName = action.payload.name;
      return {
        ...state,
        languages: state.languages.filter((l) => l.name !== langName),
        guests: state.guests.map((g) => ({
          ...g,
          languages: g.languages.filter((l) => l !== langName),
        })),
      };
    }

    case 'IMPORT_STATE': {
      return action.payload;
    }
  }
}
