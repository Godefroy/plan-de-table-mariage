export type LanguageLevel = 'native' | 'fluent' | 'intermediate' | 'basic';

export interface LanguageSkill {
  language: string;
  level: LanguageLevel;
}

export interface Guest {
  id: string;
  name: string;
  languages: LanguageSkill[];
}

export type AffinityScore = -3 | -2 | -1 | 0 | 1 | 2 | 3;

export interface AffinityPair {
  guestId1: string; // lexicographically smaller ID
  guestId2: string; // lexicographically larger ID
  score: AffinityScore;
}

export interface Couple {
  guestId1: string;
  guestId2: string;
}

export type TableShape = 'round' | 'rectangular';

export interface Table {
  id: string;
  name: string;
  shape: TableShape;
  seats: number;
}

export interface SeatAssignment {
  guestId: string;
  tableId: string;
  seatIndex: number;
}

export interface AppState {
  guests: Guest[];
  affinities: AffinityPair[];
  couples: Couple[];
  tables: Table[];
  assignments: SeatAssignment[];
}
