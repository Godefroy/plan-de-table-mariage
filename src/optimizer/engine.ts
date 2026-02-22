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

function createRandomAssignment(guests: Guest[], tables: Table[]): SeatAssignment[] {
  const totalSeats = tables.reduce((sum, t) => sum + t.seats, 0);
  if (totalSeats < guests.length) {
    throw new Error(
      `Pas assez de places : ${totalSeats} sièges pour ${guests.length} invités`
    );
  }

  // Build all available seats
  const allSeats: { tableId: string; seatIndex: number }[] = [];
  for (const table of tables) {
    for (let i = 0; i < table.seats; i++) {
      allSeats.push({ tableId: table.id, seatIndex: i });
    }
  }

  // Shuffle seats
  for (let i = allSeats.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allSeats[i], allSeats[j]] = [allSeats[j], allSeats[i]];
  }

  // Assign guests to first N seats
  return guests.map((guest, idx) => ({
    guestId: guest.id,
    tableId: allSeats[idx].tableId,
    seatIndex: allSeats[idx].seatIndex,
  }));
}

function generateNeighbor(
  current: SeatAssignment[],
  tables: Table[]
): SeatAssignment[] {
  const next = current.map((a) => ({ ...a }));
  const rand = Math.random();

  if (rand < 0.6 && next.length >= 2) {
    // Swap two guests (any two)
    const i = Math.floor(Math.random() * next.length);
    let j = Math.floor(Math.random() * (next.length - 1));
    if (j >= i) j++;

    const tmpTable = next[i].tableId;
    const tmpSeat = next[i].seatIndex;
    next[i].tableId = next[j].tableId;
    next[i].seatIndex = next[j].seatIndex;
    next[j].tableId = tmpTable;
    next[j].seatIndex = tmpSeat;
  } else if (rand < 0.9 && next.length >= 2) {
    // Swap two guests within the same table
    const tableIds = [...new Set(next.map((a) => a.tableId))];
    const tableId = tableIds[Math.floor(Math.random() * tableIds.length)];
    const tableGuests = next.filter((a) => a.tableId === tableId);
    if (tableGuests.length >= 2) {
      const i = Math.floor(Math.random() * tableGuests.length);
      let j = Math.floor(Math.random() * (tableGuests.length - 1));
      if (j >= i) j++;

      const tmpSeat = tableGuests[i].seatIndex;
      tableGuests[i].seatIndex = tableGuests[j].seatIndex;
      tableGuests[j].seatIndex = tmpSeat;
    }
  } else {
    // Move a guest to an empty seat
    const totalSeats = tables.reduce((sum, t) => sum + t.seats, 0);
    if (totalSeats > next.length) {
      // Find all occupied seats
      const occupied = new Set(next.map((a) => `${a.tableId}|${a.seatIndex}`));

      // Find all empty seats
      const emptySeats: { tableId: string; seatIndex: number }[] = [];
      for (const table of tables) {
        for (let i = 0; i < table.seats; i++) {
          if (!occupied.has(`${table.id}|${i}`)) {
            emptySeats.push({ tableId: table.id, seatIndex: i });
          }
        }
      }

      if (emptySeats.length > 0) {
        const guestIdx = Math.floor(Math.random() * next.length);
        const emptySeat = emptySeats[Math.floor(Math.random() * emptySeats.length)];
        next[guestIdx].tableId = emptySeat.tableId;
        next[guestIdx].seatIndex = emptySeat.seatIndex;
      }
    }
  }

  return next;
}

export function optimize(
  guests: Guest[],
  tables: Table[],
  affinities: AffinityPair[],
  couples: Couple[],
  config?: Partial<OptimizerConfig>,
  onProgress?: (iteration: number, bestScore: number) => void
): SeatAssignment[] {
  if (guests.length === 0 || tables.length === 0) return [];

  const cfg = { ...DEFAULT_CONFIG, ...config };
  let current = createRandomAssignment(guests, tables);
  let currentScore = computeScore(current, tables, affinities, couples, guests);
  let best = [...current.map((a) => ({ ...a }))];
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

    if (onProgress && i % 1000 === 0) {
      onProgress(i, bestScore);
    }
  }

  return best;
}
