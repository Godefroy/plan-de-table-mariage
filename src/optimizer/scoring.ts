import type { AffinityPair, Couple, Guest, SeatAssignment, Table } from '../types';
import { getAdjacentSeatIndices, getNeighborsWithWeight } from './adjacency';
import { languageCompatibility } from './language';

function normalizeIds(id1: string, id2: string): string {
  return id1 < id2 ? `${id1}|${id2}` : `${id2}|${id1}`;
}

export function computeScore(
  assignments: SeatAssignment[],
  tables: Table[],
  affinities: AffinityPair[],
  couples: Couple[],
  guests: Guest[]
): number {
  let score = 0;

  // Build lookup maps
  const affinityMap = new Map<string, number>();
  for (const a of affinities) {
    affinityMap.set(`${a.guestId1}|${a.guestId2}`, a.score);
  }

  const guestMap = new Map<string, Guest>();
  for (const g of guests) {
    guestMap.set(g.id, g);
  }

  const tableMap = new Map<string, Table>();
  for (const t of tables) {
    tableMap.set(t.id, t);
  }

  // Group assignments by table
  const byTable = new Map<string, SeatAssignment[]>();
  for (const a of assignments) {
    const arr = byTable.get(a.tableId) ?? [];
    arr.push(a);
    byTable.set(a.tableId, arr);
  }

  // Track which table each guest is at
  const guestTable = new Map<string, string>();
  for (const a of assignments) {
    guestTable.set(a.guestId, a.tableId);
  }

  // Score neighbor pairs (direct + 2nd degree) at each table
  const scoredPairs = new Set<string>();
  for (const [tableId, seats] of byTable) {
    const table = tableMap.get(tableId);
    if (!table) continue;

    const seatByIndex = new Map<number, string>();
    for (const s of seats) {
      seatByIndex.set(s.seatIndex, s.guestId);
    }

    for (const seat of seats) {
      const neighbors = getNeighborsWithWeight(table.shape, table.seats, seat.seatIndex);
      for (const neighbor of neighbors) {
        const neighborGuestId = seatByIndex.get(neighbor.seatIndex);
        if (!neighborGuestId) continue;

        const pairKey = normalizeIds(seat.guestId, neighborGuestId);
        if (scoredPairs.has(pairKey)) continue;
        scoredPairs.add(pairKey);

        // Affinity score (weighted by proximity)
        score += (affinityMap.get(pairKey) ?? 0) * neighbor.weight;

        // Language compatibility (weighted by proximity)
        const g1 = guestMap.get(seat.guestId);
        const g2 = guestMap.get(neighborGuestId);
        if (g1 && g2) {
          score += languageCompatibility(g1, g2) * neighbor.weight;
        }
      }
    }
  }

  // Couple constraints
  for (const couple of couples) {
    const t1 = guestTable.get(couple.guestId1);
    const t2 = guestTable.get(couple.guestId2);

    if (!t1 || !t2) continue;

    if (t1 !== t2) {
      score -= 200; // Different tables
      continue;
    }

    // Same table - check adjacency
    const table = tableMap.get(t1);
    if (!table) continue;

    const seats = byTable.get(t1)!;
    const seat1 = seats.find((s) => s.guestId === couple.guestId1);
    const seat2 = seats.find((s) => s.guestId === couple.guestId2);
    if (!seat1 || !seat2) continue;

    const neighbors = getAdjacentSeatIndices(table.shape, table.seats, seat1.seatIndex);
    if (!neighbors.includes(seat2.seatIndex)) {
      score -= 50; // Same table but not adjacent
    }
  }

  return score;
}
