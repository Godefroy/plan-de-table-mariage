import type { AffinityPair, Couple, Guest, SeatAssignment, Table } from '../types';
import { computeScore } from './scoring';

interface OptimizerConfig {
  initialTemperature: number;
  coolingRate: number;
  minTemperature: number;
  maxIterations: number;
}

const DEFAULT_CONFIG: OptimizerConfig = {
  initialTemperature: 10,
  coolingRate: 0.9995,
  minTemperature: 0.01,
  maxIterations: 100_000,
};

function createRandomAssignment(
  guests: Guest[],
  tables: Table[],
  lockedAssignments: SeatAssignment[] = []
): SeatAssignment[] {
  const totalSeats = tables.reduce((sum, t) => sum + t.seats, 0);
  if (totalSeats < guests.length) {
    throw new Error(
      `Pas assez de places : ${totalSeats} sièges pour ${guests.length} invités`
    );
  }

  const lockedSeatKeys = new Set(
    lockedAssignments.map((a) => `${a.tableId}|${a.seatIndex}`)
  );
  const lockedGuestIds = new Set(lockedAssignments.map((a) => a.guestId));

  // Build available (non-locked) seats
  const availableSeats: { tableId: string; seatIndex: number }[] = [];
  for (const table of tables) {
    for (let i = 0; i < table.seats; i++) {
      if (!lockedSeatKeys.has(`${table.id}|${i}`)) {
        availableSeats.push({ tableId: table.id, seatIndex: i });
      }
    }
  }

  // Shuffle seats
  for (let i = availableSeats.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableSeats[i], availableSeats[j]] = [availableSeats[j], availableSeats[i]];
  }

  // Place locked guests at their pinned seats first
  const result: SeatAssignment[] = lockedAssignments.map((a) => ({ ...a, locked: true }));

  // Place remaining guests in shuffled available seats
  const unlockedGuests = guests.filter((g) => !lockedGuestIds.has(g.id));
  unlockedGuests.forEach((guest, idx) => {
    result.push({
      guestId: guest.id,
      tableId: availableSeats[idx].tableId,
      seatIndex: availableSeats[idx].seatIndex,
    });
  });

  return result;
}

function generateNeighbor(
  current: SeatAssignment[],
  tables: Table[]
): SeatAssignment[] {
  const next = current.map((a) => ({ ...a }));
  const unlockedIndices: number[] = [];
  for (let i = 0; i < next.length; i++) {
    if (!next[i].locked) unlockedIndices.push(i);
  }
  if (unlockedIndices.length < 2) return next;

  const pickUnlocked = () =>
    unlockedIndices[Math.floor(Math.random() * unlockedIndices.length)];

  const rand = Math.random();

  if (rand < 0.6) {
    // Swap two unlocked guests (any two)
    const i = pickUnlocked();
    let j = pickUnlocked();
    while (j === i) j = pickUnlocked();

    const tmpTable = next[i].tableId;
    const tmpSeat = next[i].seatIndex;
    next[i].tableId = next[j].tableId;
    next[i].seatIndex = next[j].seatIndex;
    next[j].tableId = tmpTable;
    next[j].seatIndex = tmpSeat;
  } else if (rand < 0.9) {
    // Swap two unlocked guests within the same table
    const tableIds = [...new Set(unlockedIndices.map((i) => next[i].tableId))];
    if (tableIds.length === 0) return next;
    const tableId = tableIds[Math.floor(Math.random() * tableIds.length)];
    const tableUnlocked = unlockedIndices.filter((i) => next[i].tableId === tableId);
    if (tableUnlocked.length < 2) return next;

    const i = tableUnlocked[Math.floor(Math.random() * tableUnlocked.length)];
    let j = tableUnlocked[Math.floor(Math.random() * tableUnlocked.length)];
    while (j === i) j = tableUnlocked[Math.floor(Math.random() * tableUnlocked.length)];

    const tmpSeat = next[i].seatIndex;
    next[i].seatIndex = next[j].seatIndex;
    next[j].seatIndex = tmpSeat;
  } else {
    // Move an unlocked guest to an empty (non-locked) seat
    const totalSeats = tables.reduce((sum, t) => sum + t.seats, 0);
    if (totalSeats > next.length) {
      const occupied = new Set(next.map((a) => `${a.tableId}|${a.seatIndex}`));
      const emptySeats: { tableId: string; seatIndex: number }[] = [];
      for (const table of tables) {
        for (let i = 0; i < table.seats; i++) {
          if (!occupied.has(`${table.id}|${i}`)) {
            emptySeats.push({ tableId: table.id, seatIndex: i });
          }
        }
      }
      if (emptySeats.length > 0) {
        const guestIdx = pickUnlocked();
        const emptySeat = emptySeats[Math.floor(Math.random() * emptySeats.length)];
        next[guestIdx].tableId = emptySeat.tableId;
        next[guestIdx].seatIndex = emptySeat.seatIndex;
      }
    }
  }

  return next;
}

function extendAssignment(
  existing: SeatAssignment[],
  guests: Guest[],
  tables: Table[]
): SeatAssignment[] {
  const placed = new Set(existing.map((a) => a.guestId));
  const occupied = new Set(existing.map((a) => `${a.tableId}|${a.seatIndex}`));

  const freeSeats: { tableId: string; seatIndex: number }[] = [];
  for (const t of tables) {
    for (let i = 0; i < t.seats; i++) {
      if (!occupied.has(`${t.id}|${i}`)) {
        freeSeats.push({ tableId: t.id, seatIndex: i });
      }
    }
  }
  for (let i = freeSeats.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [freeSeats[i], freeSeats[j]] = [freeSeats[j], freeSeats[i]];
  }

  const missing = guests.filter((g) => !placed.has(g.id));
  if (missing.length > freeSeats.length) {
    const totalSeats = tables.reduce((s, t) => s + t.seats, 0);
    throw new Error(
      `Pas assez de places : ${totalSeats} sièges pour ${guests.length} invités`
    );
  }

  const result = existing.map((a) => ({ ...a }));
  missing.forEach((g, idx) => {
    result.push({
      guestId: g.id,
      tableId: freeSeats[idx].tableId,
      seatIndex: freeSeats[idx].seatIndex,
    });
  });
  return result;
}

const DEFAULT_PASSES = 5;

function runPass(
  initialAssignment: SeatAssignment[],
  tables: Table[],
  affinities: AffinityPair[],
  couples: Couple[],
  guests: Guest[],
  cfg: OptimizerConfig
): { best: SeatAssignment[]; bestScore: number } {
  let current = initialAssignment;
  let currentScore = computeScore(current, tables, affinities, couples, guests);
  let best = current.map((a) => ({ ...a }));
  let bestScore = currentScore;
  let temperature = cfg.initialTemperature;

  for (let i = 0; i < cfg.maxIterations && temperature > cfg.minTemperature; i++) {
    const neighbor = generateNeighbor(current, tables);
    const neighborScore = computeScore(neighbor, tables, affinities, couples, guests);
    const delta = neighborScore - currentScore;

    if (delta > 0 || Math.random() < Math.exp(delta / temperature)) {
      current = neighbor;
      currentScore = neighborScore;
    }

    if (currentScore > bestScore) {
      best = current.map((a) => ({ ...a }));
      bestScore = currentScore;
    }

    temperature *= cfg.coolingRate;
  }

  return { best, bestScore };
}

export function optimize(
  guests: Guest[],
  tables: Table[],
  affinities: AffinityPair[],
  couples: Couple[],
  config?: Partial<OptimizerConfig>,
  onProgress?: (pass: number, totalPasses: number, bestScore: number) => void,
  existingAssignments?: SeatAssignment[]
): SeatAssignment[] {
  if (guests.length === 0 || tables.length === 0) return [];

  const cfg = { ...DEFAULT_CONFIG, ...config };
  const totalPasses = DEFAULT_PASSES;

  const validExisting = (existingAssignments ?? []).filter((a) => {
    const t = tables.find((tab) => tab.id === a.tableId);
    return t !== undefined && a.seatIndex < t.seats && guests.some((g) => g.id === a.guestId);
  });
  const lockedAssignments = validExisting.filter((a) => a.locked);

  let globalBest: SeatAssignment[] = [];
  let globalBestScore = -Infinity;

  for (let pass = 0; pass < totalPasses; pass++) {
    // First pass: start from existing assignments (filling any gaps), otherwise random
    const initial =
      pass === 0 && validExisting.length > 0
        ? extendAssignment(validExisting, guests, tables)
        : createRandomAssignment(guests, tables, lockedAssignments);

    const { best, bestScore } = runPass(initial, tables, affinities, couples, guests, cfg);

    if (bestScore > globalBestScore) {
      globalBest = best;
      globalBestScore = bestScore;
    }

    onProgress?.(pass + 1, totalPasses, globalBestScore);
  }

  return globalBest;
}
