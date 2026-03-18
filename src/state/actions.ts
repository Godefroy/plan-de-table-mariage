import type { AffinityScore, AppState, Language, SeatAssignment, TableShape } from '../types';

export type AppAction =
  | { type: 'ADD_GUEST'; payload: { name: string; id?: string } }
  | { type: 'UPDATE_GUEST'; payload: { id: string; name: string } }
  | { type: 'REMOVE_GUEST'; payload: { id: string } }
  | { type: 'SET_GUEST_LANGUAGES'; payload: { id: string; languages: string[] } }
  | { type: 'SET_AFFINITY'; payload: { guestId1: string; guestId2: string; score: AffinityScore; keepAssignments?: boolean } }
  | { type: 'REMOVE_AFFINITY'; payload: { guestId1: string; guestId2: string } }
  | { type: 'ADD_COUPLE'; payload: { guestId1: string; guestId2: string } }
  | { type: 'REMOVE_COUPLE'; payload: { guestId1: string; guestId2: string } }
  | { type: 'ADD_TABLE'; payload: { name: string; shape: TableShape; seats: number; customSides?: [number, number, number, number] } }
  | { type: 'UPDATE_TABLE'; payload: { id: string; name: string; shape: TableShape; seats: number; customSides?: [number, number, number, number] } }
  | { type: 'REMOVE_TABLE'; payload: { id: string } }
  | { type: 'SET_ASSIGNMENTS'; payload: SeatAssignment[] }
  | { type: 'CLEAR_ASSIGNMENTS' }
  | { type: 'ADD_LANGUAGE'; payload: Language }
  | { type: 'REMOVE_LANGUAGE'; payload: { name: string } }
  | { type: 'IMPORT_STATE'; payload: AppState };
