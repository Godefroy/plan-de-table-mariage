import { useState, useMemo } from 'react';
import type { Table, SeatAssignment, Guest, AffinityScore } from '../../types';
import { useAppState, useAppDispatch } from '../../state/AppContext';
import { getNeighborsWithWeight } from '../../optimizer/adjacency';
import { SCORE_CYCLE } from './tableUtils';

export function useTableInteraction(table: Table, assignments: SeatAssignment[], guestMap: Map<string, Guest>) {
  const [hoveredSeat, setHoveredSeat] = useState<number | null>(null);
  const { affinities, couples } = useAppState();
  const dispatch = useAppDispatch();

  const assignmentBySeat = useMemo(() => {
    const map = new Map<number, SeatAssignment>();
    for (const a of assignments) {
      map.set(a.seatIndex, a);
    }
    return map;
  }, [assignments]);

  const affinityMap = useMemo(() => {
    const map = new Map<string, AffinityScore>();
    for (const a of affinities) {
      map.set(`${a.guestId1}:${a.guestId2}`, a.score);
    }
    return map;
  }, [affinities]);

  const coupleSet = useMemo(() => {
    const set = new Set<string>();
    for (const c of couples) {
      const key = c.guestId1 < c.guestId2 ? `${c.guestId1}:${c.guestId2}` : `${c.guestId2}:${c.guestId1}`;
      set.add(key);
    }
    return set;
  }, [couples]);

  const isCouple = (idA: string, idB: string): boolean => {
    const [id1, id2] = idA < idB ? [idA, idB] : [idB, idA];
    return coupleSet.has(`${id1}:${id2}`);
  };

  const getAffinity = (idA: string, idB: string): AffinityScore => {
    const [id1, id2] = idA < idB ? [idA, idB] : [idB, idA];
    return affinityMap.get(`${id1}:${id2}`) ?? 0;
  };

  const cycleScore = (idA: string, idB: string, reverse: boolean) => {
    const score = getAffinity(idA, idB);
    const idx = SCORE_CYCLE.indexOf(score);
    const nextIdx = reverse
      ? (idx - 1 + SCORE_CYCLE.length) % SCORE_CYCLE.length
      : (idx + 1) % SCORE_CYCLE.length;
    const [id1, id2] = idA < idB ? [idA, idB] : [idB, idA];
    dispatch({
      type: 'SET_AFFINITY',
      payload: { guestId1: id1, guestId2: id2, score: SCORE_CYCLE[nextIdx], keepAssignments: true },
    });
  };

  const handleScoreClick = (e: React.MouseEvent, idA: string, idB: string) => {
    e.stopPropagation();
    cycleScore(idA, idB, e.shiftKey);
  };

  const handleScoreContextMenu = (e: React.MouseEvent, idA: string, idB: string) => {
    e.preventDefault();
    e.stopPropagation();
    cycleScore(idA, idB, true);
  };

  const hoveredGuest = hoveredSeat !== null ? assignmentBySeat.get(hoveredSeat) : null;
  const hoveredGuestId = hoveredGuest ? hoveredGuest.guestId : null;

  const neighborLinks = useMemo(() => {
    if (hoveredSeat === null || !hoveredGuestId) return [];
    const neighbors = getNeighborsWithWeight(table.shape, table.seats, hoveredSeat, table.customSides);
    return neighbors
      .map((n) => {
        const neighborAssignment = assignmentBySeat.get(n.seatIndex);
        if (!neighborAssignment) return null;
        const neighborGuest = guestMap.get(neighborAssignment.guestId);
        if (!neighborGuest) return null;
        return { ...n, guestId: neighborAssignment.guestId, guest: neighborGuest };
      })
      .filter(Boolean) as Array<{ seatIndex: number; weight: number; guestId: string; guest: Guest }>;
  }, [hoveredSeat, hoveredGuestId, table.shape, table.seats, table.customSides, assignmentBySeat, guestMap]);

  return {
    hoveredSeat,
    setHoveredSeat,
    assignmentBySeat,
    hoveredGuestId,
    neighborLinks,
    isCouple,
    getAffinity,
    handleScoreClick,
    handleScoreContextMenu,
  };
}
