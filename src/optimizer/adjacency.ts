import type { TableShape } from '../types';

export interface SeatNeighbor {
  seatIndex: number;
  weight: number;
}

export function getTableSides(
  shape: TableShape,
  totalSeats: number,
  customSides?: [number, number, number, number]
): [number, number, number, number] | null {
  if (shape === 'square') {
    const perSide = Math.floor(totalSeats / 4);
    return [perSide, perSide, perSide, perSide];
  }
  if (shape === 'custom' && customSides) {
    return customSides;
  }
  return null;
}

export function getAdjacentSeatIndices(
  shape: TableShape,
  totalSeats: number,
  seatIndex: number,
  customSides?: [number, number, number, number]
): number[] {
  return getNeighborsWithWeight(shape, totalSeats, seatIndex, customSides)
    .filter((n) => n.weight === 1)
    .map((n) => n.seatIndex);
}

export function getNeighborsWithWeight(
  shape: TableShape,
  totalSeats: number,
  seatIndex: number,
  customSides?: [number, number, number, number]
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
  } else if (shape === 'rectangular') {
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
  } else {
    // Square / Custom: seats around 4 sides of a table
    const sides = getTableSides(shape, totalSeats, customSides);
    if (!sides) return neighbors;

    const total = sides[0] + sides[1] + sides[2] + sides[3];
    const cumulative = [0, sides[0], sides[0] + sides[1], sides[0] + sides[1] + sides[2], total];

    const sideOf = (idx: number): number => {
      for (let s = 0; s < 4; s++) {
        if (idx >= cumulative[s] && idx < cumulative[s + 1]) return s;
      }
      return -1;
    };

    // Check if going from one side to another crosses an empty side
    const hasEmptyGap = (fromSide: number, toSide: number, clockwise: boolean): boolean => {
      if (fromSide === toSide) return false;
      const step = clockwise ? 1 : 3; // +1 or -1 mod 4
      let s = (fromSide + step) % 4;
      while (s !== toSide) {
        if (sides[s] === 0) return true;
        s = (s + step) % 4;
      }
      return false;
    };

    const mySide = sideOf(seatIndex);

    // Perimeter neighbors (weight 1): previous and next seat
    const next = (seatIndex + 1) % total;
    const nextSide = sideOf(next);
    if (!hasEmptyGap(mySide, nextSide, true)) {
      seen.add(next);
      neighbors.push({ seatIndex: next, weight: 1 });
    }

    const prev = (seatIndex - 1 + total) % total;
    const prevSide = sideOf(prev);
    if (!hasEmptyGap(mySide, prevSide, false)) {
      seen.add(prev);
      neighbors.push({ seatIndex: prev, weight: 1 });
    }

    // 2nd degree perimeter (weight 0.75)
    const next2 = (seatIndex + 2) % total;
    const next2Side = sideOf(next2);
    if (!seen.has(next2) && next2 !== seatIndex && !hasEmptyGap(mySide, next2Side, true)) {
      seen.add(next2);
      neighbors.push({ seatIndex: next2, weight: 0.75 });
    }

    const prev2 = (seatIndex - 2 + total) % total;
    const prev2Side = sideOf(prev2);
    if (!seen.has(prev2) && prev2 !== seatIndex && !hasEmptyGap(mySide, prev2Side, false)) {
      seen.add(prev2);
      neighbors.push({ seatIndex: prev2, weight: 0.75 });
    }

    // No across neighbors for square/custom tables
  }

  return neighbors;
}
