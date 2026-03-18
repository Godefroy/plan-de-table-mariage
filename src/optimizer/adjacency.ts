import type { TableShape } from '../types';

export interface SeatNeighbor {
  seatIndex: number;
  weight: number;
}

export function getAdjacentSeatIndices(
  shape: TableShape,
  totalSeats: number,
  seatIndex: number
): number[] {
  return getNeighborsWithWeight(shape, totalSeats, seatIndex)
    .filter((n) => n.weight === 1)
    .map((n) => n.seatIndex);
}

export function getNeighborsWithWeight(
  shape: TableShape,
  totalSeats: number,
  seatIndex: number
): SeatNeighbor[] {
  const neighbors: SeatNeighbor[] = [];
  const seen = new Set<number>();

  if (shape === 'round') {
    // Direct neighbors (weight 1)
    const prev = (seatIndex - 1 + totalSeats) % totalSeats;
    const next = (seatIndex + 1) % totalSeats;
    for (const idx of [prev, next]) {
      if (idx !== seatIndex && !seen.has(idx)) {
        seen.add(idx);
        neighbors.push({ seatIndex: idx, weight: 1 });
      }
    }
    // 2nd degree: one person between (weight 0.75)
    const prev2 = (seatIndex - 2 + totalSeats) % totalSeats;
    const next2 = (seatIndex + 2) % totalSeats;
    for (const idx of [prev2, next2]) {
      if (idx !== seatIndex && !seen.has(idx)) {
        seen.add(idx);
        neighbors.push({ seatIndex: idx, weight: 0.75 });
      }
    }
  } else {
    // Rectangular: two rows of halfN each
    const halfN = Math.floor(totalSeats / 2);
    const isTopSide = seatIndex < halfN;
    const posInRow = isTopSide ? seatIndex : seatIndex - halfN;

    // Direct neighbors (weight 1): left, right, across
    if (posInRow > 0) {
      const idx = isTopSide ? posInRow - 1 : halfN + posInRow - 1;
      seen.add(idx);
      neighbors.push({ seatIndex: idx, weight: 1 });
    }
    if (posInRow < halfN - 1) {
      const idx = isTopSide ? posInRow + 1 : halfN + posInRow + 1;
      seen.add(idx);
      neighbors.push({ seatIndex: idx, weight: 1 });
    }
    const across = isTopSide ? halfN + posInRow : posInRow;
    if (across < totalSeats) {
      seen.add(across);
      neighbors.push({ seatIndex: across, weight: 1 });
    }

    // 2nd degree (weight 0.75): same row +/-2, diagonals
    if (posInRow > 1) {
      const idx = isTopSide ? posInRow - 2 : halfN + posInRow - 2;
      if (!seen.has(idx)) {
        seen.add(idx);
        neighbors.push({ seatIndex: idx, weight: 0.75 });
      }
    }
    if (posInRow < halfN - 2) {
      const idx = isTopSide ? posInRow + 2 : halfN + posInRow + 2;
      if (!seen.has(idx)) {
        seen.add(idx);
        neighbors.push({ seatIndex: idx, weight: 0.75 });
      }
    }
    // Diagonal left (across - 1)
    if (posInRow > 0) {
      const idx = isTopSide ? halfN + posInRow - 1 : posInRow - 1;
      if (idx < totalSeats && !seen.has(idx)) {
        seen.add(idx);
        neighbors.push({ seatIndex: idx, weight: 0.75 });
      }
    }
    // Diagonal right (across + 1)
    if (posInRow < halfN - 1) {
      const idx = isTopSide ? halfN + posInRow + 1 : posInRow + 1;
      if (idx < totalSeats && !seen.has(idx)) {
        seen.add(idx);
        neighbors.push({ seatIndex: idx, weight: 0.75 });
      }
    }
  }

  return neighbors;
}
