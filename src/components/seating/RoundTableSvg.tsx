import { useState, useMemo } from 'react';
import type { Table, SeatAssignment, Guest, AffinityScore } from '../../types';
import { useAppState, useAppDispatch } from '../../state/AppContext';
import { getNeighborsWithWeight } from '../../optimizer/adjacency';
import styles from './SeatingPlan.module.css';

const SCORE_CYCLE: AffinityScore[] = [0, 1, 2, 3, -1, -2, -3];

function getLinkColor(score: number): string {
  if (score === 0) return '#9ca3af';
  if (score > 0) return ['', '#86efac', '#22c55e', '#16a34a'][score];
  return ['', '#fca5a5', '#ef4444', '#dc2626'][-score];
}

function getBadgeBg(score: number): string {
  if (score === 0) return '#f3f4f6';
  if (score > 0) return `rgba(34, 197, 94, ${0.15 + (score / 3) * 0.45})`;
  return `rgba(239, 68, 68, ${0.15 + (Math.abs(score) / 3) * 0.45})`;
}

interface Props {
  table: Table;
  assignments: SeatAssignment[];
  guestMap: Map<string, Guest>;
}

export function RoundTableSvg({ table, assignments, guestMap }: Props) {
  const [hoveredSeat, setHoveredSeat] = useState<number | null>(null);
  const { affinities, couples } = useAppState();
  const dispatch = useAppDispatch();

  const size = 340;
  const cx = size / 2;
  const cy = size / 2;
  const tableRadius = 65;
  const seatRadius = 26;
  const seatOrbitRadius = tableRadius + seatRadius + 12;

  const seatPositions = Array.from({ length: table.seats }, (_, i) => {
    const angle = (2 * Math.PI * i) / table.seats - Math.PI / 2;
    return {
      x: cx + seatOrbitRadius * Math.cos(angle),
      y: cy + seatOrbitRadius * Math.sin(angle),
    };
  });

  const assignmentBySeat = new Map<number, SeatAssignment>();
  for (const a of assignments) {
    assignmentBySeat.set(a.seatIndex, a);
  }

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

  // Compute neighbor links when hovering
  const hoveredGuest = hoveredSeat !== null ? assignmentBySeat.get(hoveredSeat) : null;
  const hoveredGuestId = hoveredGuest ? hoveredGuest.guestId : null;
  const neighborLinks = useMemo(() => {
    if (hoveredSeat === null || !hoveredGuestId) return [];
    const neighbors = getNeighborsWithWeight(table.shape, table.seats, hoveredSeat);
    return neighbors
      .map((n) => {
        const neighborAssignment = assignmentBySeat.get(n.seatIndex);
        if (!neighborAssignment) return null;
        const neighborGuest = guestMap.get(neighborAssignment.guestId);
        if (!neighborGuest) return null;
        return { ...n, guestId: neighborAssignment.guestId, guest: neighborGuest };
      })
      .filter(Boolean) as Array<{ seatIndex: number; weight: number; guestId: string; guest: Guest }>;
  }, [hoveredSeat, hoveredGuestId, table.shape, table.seats, assignmentBySeat, guestMap]);

  return (
    <div className={styles.tableCard}>
      <h3 className={styles.tableName}>{table.name}</h3>
      <div className={styles.svgWrapper}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          width={size}
          height={size}
          onMouseLeave={() => setHoveredSeat(null)}
        >
          {/* Table circle */}
          <circle cx={cx} cy={cy} r={tableRadius} fill="#fdf2f8" stroke="#f9a8d4" strokeWidth={2} />

          {/* Curved links on hover */}
          {hoveredSeat !== null && hoveredGuestId && neighborLinks.map((n) => {
            const from = seatPositions[hoveredSeat];
            const to = seatPositions[n.seatIndex];
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;
            let cpX: number, cpY: number;
            if (n.weight === 1) {
              // Degree 1: curve outward (away from center)
              cpX = midX + (midX - cx) * 0.5;
              cpY = midY + (midY - cy) * 0.5;
            } else {
              // Degree 2: curve inward (toward center)
              cpX = (midX + cx) / 2;
              cpY = (midY + cy) / 2;
            }
            const couple = isCouple(hoveredGuestId, n.guestId);
            const score = getAffinity(hoveredGuestId, n.guestId);
            return (
              <path
                key={`link-${n.seatIndex}`}
                d={`M ${from.x},${from.y} Q ${cpX},${cpY} ${to.x},${to.y}`}
                fill="none"
                stroke={couple ? '#e11d48' : getLinkColor(score)}
                strokeWidth={n.weight === 1 ? 2.5 : 1.5}
                strokeDasharray={n.weight === 1 ? 'none' : '6 3'}
                opacity={0.8}
              />
            );
          })}

          {/* Seats */}
          {seatPositions.map((pos, i) => {
            const assignment = assignmentBySeat.get(i);
            const guest = assignment ? guestMap.get(assignment.guestId) : null;
            const filled = !!guest;
            const isHovered = hoveredSeat === i;
            const isNeighbor = hoveredSeat !== null && neighborLinks.some((n) => n.seatIndex === i);

            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredSeat(filled ? i : null)}
                style={{ cursor: filled ? 'pointer' : 'default' }}
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={seatRadius}
                  fill={filled ? '#fdf2f8' : '#f9fafb'}
                  stroke={isHovered ? '#9d174d' : isNeighbor ? '#f472b6' : filled ? '#db2777' : '#d1d5db'}
                  strokeWidth={isHovered || isNeighbor ? 2.5 : 1.5}
                />
                <text
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={10}
                  fill={filled ? '#1f2937' : '#9ca3af'}
                >
                  {filled ? (guest!.name.length > 10 ? guest!.name.slice(0, 9) + '.' : guest!.name) : i + 1}
                </text>
              </g>
            );
          })}

          {/* Score badges on hover */}
          {hoveredSeat !== null && hoveredGuestId && neighborLinks.map((n) => {
            const from = seatPositions[hoveredSeat];
            const to = seatPositions[n.seatIndex];
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;
            let cpX: number, cpY: number;
            if (n.weight === 1) {
              cpX = midX + (midX - cx) * 0.5;
              cpY = midY + (midY - cy) * 0.5;
            } else {
              cpX = (midX + cx) / 2;
              cpY = (midY + cy) / 2;
            }
            const bx = (from.x + 2 * cpX + to.x) / 4;
            const by = (from.y + 2 * cpY + to.y) / 4;
            const couple = isCouple(hoveredGuestId, n.guestId);

            if (couple) {
              return (
                <text key={`badge-${n.seatIndex}`} x={bx} y={by} textAnchor="middle" dominantBaseline="central" fontSize={14}>
                  ❤️
                </text>
              );
            }

            const score = getAffinity(hoveredGuestId, n.guestId);
            const label = score === 0 ? '0' : score > 0 ? `+${score}` : `${score}`;
            return (
              <g
                key={`badge-${n.seatIndex}`}
                onClick={(e) => handleScoreClick(e, hoveredGuestId, n.guestId)}
                onContextMenu={(e) => handleScoreContextMenu(e, hoveredGuestId, n.guestId)}
                style={{ cursor: 'pointer' }}
              >
                <circle cx={bx} cy={by} r={12} fill={getBadgeBg(score)} stroke={getLinkColor(score)} strokeWidth={1.5} />
                <text x={bx} y={by} textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={600} fill="#1f2937">
                  {label}
                </text>
              </g>
            );
          })}

        </svg>
      </div>
    </div>
  );
}
