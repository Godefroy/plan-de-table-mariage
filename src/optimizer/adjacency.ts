import type { TableShape } from '../types';

export function getAdjacentSeatIndices(
  shape: TableShape,
  totalSeats: number,
  seatIndex: number
): number[] {
  if (shape === 'round') {
    const prev = (seatIndex - 1 + totalSeats) % totalSeats;
    const next = (seatIndex + 1) % totalSeats;
    return prev === next ? [prev] : [prev, next];
  }

  // Rectangular: two rows of halfN each
  // Side A: indices 0 .. halfN-1 (top)
  // Side B: indices halfN .. totalSeats-1 (bottom)
  const halfN = Math.floor(totalSeats / 2);
  const isTopSide = seatIndex < halfN;
  const posInRow = isTopSide ? seatIndex : seatIndex - halfN;
  const adjacent: number[] = [];

  // Same-side left neighbor
  if (posInRow > 0) {
    adjacent.push(isTopSide ? posInRow - 1 : halfN + posInRow - 1);
  }
  // Same-side right neighbor
  if (posInRow < halfN - 1) {
    adjacent.push(isTopSide ? posInRow + 1 : halfN + posInRow + 1);
  }
  // Person directly across
  const across = isTopSide ? halfN + posInRow : posInRow;
  if (across < totalSeats) {
    adjacent.push(across);
  }

  return adjacent;
}
