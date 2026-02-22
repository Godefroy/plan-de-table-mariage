import type { AppState } from '../types';
import type { AppAction } from './actions';

function normalizeIds(id1: string, id2: string): [string, string] {
  return id1 < id2 ? [id1, id2] : [id2, id1];
}

export const defaultState: AppState = {
  guests: [],
  affinities: [],
  couples: [],
  tables: [],
  assignments: [],
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_GUEST': {
      const newGuest = {
        id: crypto.randomUUID(),
        name: action.payload.name,
        languages: [],
      };
      return { ...state, guests: [...state.guests, newGuest], assignments: [] };
    }

    case 'UPDATE_GUEST': {
      return {
        ...state,
        guests: state.guests.map((g) =>
          g.id === action.payload.id ? { ...g, name: action.payload.name } : g
        ),
        assignments: [],
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
        assignments: [],
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
        assignments: [],
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
      return { ...state, affinities, assignments: [] };
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
        assignments: [],
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
        assignments: [],
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
        assignments: [],
      };
    }

    case 'ADD_TABLE': {
      const newTable = {
        id: crypto.randomUUID(),
        name: action.payload.name,
        shape: action.payload.shape,
        seats: action.payload.seats,
      };
      return { ...state, tables: [...state.tables, newTable], assignments: [] };
    }

    case 'UPDATE_TABLE': {
      return {
        ...state,
        tables: state.tables.map((t) =>
          t.id === action.payload.id
            ? {
                ...t,
                name: action.payload.name,
                shape: action.payload.shape,
                seats: action.payload.seats,
              }
            : t
        ),
        assignments: [],
      };
    }

    case 'REMOVE_TABLE': {
      return {
        ...state,
        tables: state.tables.filter((t) => t.id !== action.payload.id),
        assignments: [],
      };
    }

    case 'SET_ASSIGNMENTS': {
      return { ...state, assignments: action.payload };
    }

    case 'CLEAR_ASSIGNMENTS': {
      return { ...state, assignments: [] };
    }

    case 'IMPORT_STATE': {
      return action.payload;
    }
  }
}
