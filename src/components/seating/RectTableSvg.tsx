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

export function RectTableSvg({ table, assignments, guestMap }: Props) {
  const [hoveredSeat, setHoveredSeat] = useState<number | null>(null);
  const { affinities, couples } = useAppState();
  const dispatch = useAppDispatch();

  const halfN = Math.floor(table.seats / 2);
  const seatW = 80;
  const seatH = 34;
  const gap = 10;
  const tableW = halfN * (seatW + gap) - gap + 20;
  const tableH = 40;
  const svgW = tableW + 40;
  const svgH = 180;
  const tableX = (svgW - tableW) / 2;
  const tableY = (svgH - tableH) / 2;
  const tableCenterX = tableX + tableW / 2;
  const tableCenterY = tableY + tableH / 2;

  const topY = tableY - seatH - 8;
  const bottomY = tableY + tableH + 8;

  const assignmentBySeat = new Map<number, SeatAssignment>();
  for (const a of assignments) {
    assignmentBySeat.set(a.seatIndex, a);
  }

  // Compute seat center positions for link drawing
  const seatCenters = useMemo(() => {
    const centers = new Map<number, { x: number; y: number }>();
    for (let i = 0; i < halfN; i++) {
      const x = tableX + 10 + i * (seatW + gap) + seatW / 2;
      centers.set(i, { x, y: topY + seatH / 2 });
      centers.set(halfN + i, { x, y: bottomY + seatH / 2 });
    }
    return centers;
  }, [halfN, tableX, seatW, gap, topY, bottomY, seatH]);

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

  const handleScoreClick = (e: React.MouseEvent, idA: string, idB: string) => {
    e.stopPropagation();
    const score = getAffinity(idA, idB);
    const idx = SCORE_CYCLE.indexOf(score);
    const nextIdx = e.shiftKey
      ? (idx - 1 + SCORE_CYCLE.length) % SCORE_CYCLE.length
      : (idx + 1) % SCORE_CYCLE.length;
    const [id1, id2] = idA < idB ? [idA, idB] : [idB, idA];
    dispatch({
      type: 'SET_AFFINITY',
      payload: { guestId1: id1, guestId2: id2, score: SCORE_CYCLE[nextIdx], keepAssignments: true },
    });
  };

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

  const renderSeat = (seatIndex: number, x: number, y: number) => {
    const assignment = assignmentBySeat.get(seatIndex);
    const guest = assignment ? guestMap.get(assignment.guestId) : null;
    const filled = !!guest;
    const isHovered = hoveredSeat === seatIndex;
    const isNeighbor = hoveredSeat !== null && neighborLinks.some((n) => n.seatIndex === seatIndex);

    return (
      <g
        key={seatIndex}
        onMouseEnter={() => setHoveredSeat(filled ? seatIndex : null)}
        style={{ cursor: filled ? 'pointer' : 'default' }}
      >
        <rect
          x={x}
          y={y}
          width={seatW}
          height={seatH}
          rx={6}
          fill={filled ? '#fdf2f8' : '#f9fafb'}
          stroke={isHovered ? '#9d174d' : isNeighbor ? '#f472b6' : filled ? '#db2777' : '#d1d5db'}
          strokeWidth={isHovered || isNeighbor ? 2.5 : 1.5}
        />
        <text
          x={x + seatW / 2}
          y={y + seatH / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={10}
          fill={filled ? '#1f2937' : '#9ca3af'}
        >
          {filled
            ? guest!.name.length > 12
              ? guest!.name.slice(0, 11) + '.'
              : guest!.name
            : seatIndex + 1}
        </text>
      </g>
    );
  };

  return (
    <div className={styles.tableCard}>
      <h3 className={styles.tableName}>{table.name}</h3>
      <div className={styles.svgWrapper}>
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          width={svgW}
          height={svgH}
          onMouseLeave={() => setHoveredSeat(null)}
        >
          {/* Table rectangle */}
          <rect
            x={tableX}
            y={tableY}
            width={tableW}
            height={tableH}
            rx={8}
            fill="#fdf2f8"
            stroke="#f9a8d4"
            strokeWidth={2}
          />
          <text
            x={tableCenterX}
            y={tableCenterY}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={14}
            fontWeight={600}
            fill="#9d174d"
          >
            {table.name}
          </text>

          {/* Links on hover */}
          {hoveredSeat !== null && hoveredGuestId && neighborLinks.map((n) => {
            const from = seatCenters.get(hoveredSeat)!;
            const to = seatCenters.get(n.seatIndex)!;
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;
            const hoveredIsTop = hoveredSeat < halfN;
            const neighborIsTop = n.seatIndex < halfN;
            const sameRow = hoveredIsTop === neighborIsTop;
            const couple = isCouple(hoveredGuestId, n.guestId);
            const score = getAffinity(hoveredGuestId, n.guestId);
            const color = couple ? '#e11d48' : getLinkColor(score);

            let d: string;
            if (!sameRow) {
              // Across: straight line
              d = `M ${from.x},${from.y} L ${to.x},${to.y}`;
            } else if (n.weight === 1) {
              // Same row, direct neighbor: curve outward
              const outwardY = hoveredIsTop ? midY - 65 : midY + 65;
              d = `M ${from.x},${from.y} Q ${midX},${outwardY} ${to.x},${to.y}`;
            } else {
              // Same row, indirect neighbor: curve inward, offset to clear direct neighbor
              const inwardY = hoveredIsTop ? midY + 65 : midY - 65;
              d = `M ${from.x},${from.y} Q ${midX},${inwardY} ${to.x},${to.y}`;
            }

            return (
              <path
                key={`link-${n.seatIndex}`}
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={n.weight === 1 ? 2.5 : 1.5}
                strokeDasharray={n.weight === 1 ? 'none' : '6 3'}
                opacity={0.8}
              />
            );
          })}

          {/* Top seats */}
          {Array.from({ length: halfN }, (_, i) => {
            const x = tableX + 10 + i * (seatW + gap);
            return renderSeat(i, x, topY);
          })}

          {/* Bottom seats */}
          {Array.from({ length: halfN }, (_, i) => {
            const x = tableX + 10 + i * (seatW + gap);
            return renderSeat(halfN + i, x, bottomY);
          })}

          {/* Score badges on hover */}
          {hoveredSeat !== null && hoveredGuestId && neighborLinks.map((n) => {
            const from = seatCenters.get(hoveredSeat)!;
            const to = seatCenters.get(n.seatIndex)!;
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;
            const hoveredIsTop = hoveredSeat < halfN;
            const neighborIsTop = n.seatIndex < halfN;
            const sameRow = hoveredIsTop === neighborIsTop;

            let bx: number, by: number;
            if (!sameRow) {
              // Straight line: badge at midpoint
              bx = midX;
              by = midY;
            } else if (n.weight === 1) {
              // Outward curve — badge on the exterior arc
              const outwardY = hoveredIsTop ? midY - 65 : midY + 65;
              bx = (from.x + 2 * midX + to.x) / 4;
              by = (from.y + 2 * outwardY + to.y) / 4;
            } else {
              // Inward curve with offset
              const inwardY = hoveredIsTop ? midY + 65 : midY - 65;
              bx = (from.x + 2 * midX + to.x) / 4;
              by = (from.y + 2 * inwardY + to.y) / 4;
            }
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
