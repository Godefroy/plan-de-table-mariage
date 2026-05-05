import { useMemo } from 'react';
import type { Table, SeatAssignment, Guest } from '../../types';
import { useAppState } from '../../state/AppContext';
import { useTableInteraction } from './useTableInteraction';
import { getLinkColor, getBadgeBg, LOCK_OFFSET } from './tableUtils';
import { SeatLock } from './SeatLock';
import { SwapMenu } from './SwapMenu';
import styles from './SeatingPlan.module.css';

interface Props {
  table: Table;
  assignments: SeatAssignment[];
  guestMap: Map<string, Guest>;
}

export function RectTableSvg({ table, assignments, guestMap }: Props) {
  const { guests } = useAppState();
  const {
    hoveredSeat, setHoveredSeat, assignmentBySeat,
    hoveredGuestId, neighborLinks,
    isCouple, getAffinity, handleScoreClick, handleScoreContextMenu,
    swapSeat, openSwap, closeSwap, toggleLock, swapWith,
  } = useTableInteraction(table, assignments, guestMap);

  const halfN = Math.floor(table.seats / 2);
  const seatRadius = 26;
  const seatSpacing = 58;
  const seatOffset = seatRadius + 14;

  const tableW = Math.max((halfN - 1) * seatSpacing + 40, 80);
  const tableH = 40;
  const svgW = tableW + 2 * (seatOffset + seatRadius) + 40;
  const svgH = tableH + 2 * (seatOffset + seatRadius) + 40;
  const cx = svgW / 2;
  const cy = svgH / 2;

  const seatCenters = useMemo(() => {
    const centers = new Map<number, { x: number; y: number }>();
    for (let i = 0; i < halfN; i++) {
      const x = halfN <= 1 ? cx : cx - (halfN - 1) * seatSpacing / 2 + i * seatSpacing;
      centers.set(i, { x, y: cy - tableH / 2 - seatOffset });
      centers.set(halfN + i, { x, y: cy + tableH / 2 + seatOffset });
    }
    return centers;
  }, [halfN, cx, cy, tableH, seatSpacing, seatOffset]);

  const swapAssignment = swapSeat !== null ? assignmentBySeat.get(swapSeat) : null;
  const swapPos = swapSeat !== null ? seatCenters.get(swapSeat) : null;

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
            x={cx - tableW / 2}
            y={cy - tableH / 2}
            width={tableW}
            height={tableH}
            rx={8}
            fill="#fdf2f8"
            stroke="#f9a8d4"
            strokeWidth={2}
          />

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
              d = `M ${from.x},${from.y} L ${to.x},${to.y}`;
            } else if (n.weight === 1) {
              const outwardY = hoveredIsTop ? midY - 65 : midY + 65;
              d = `M ${from.x},${from.y} Q ${midX},${outwardY} ${to.x},${to.y}`;
            } else {
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

          {/* Seats */}
          {Array.from(seatCenters.entries()).map(([i, pos]) => {
            const assignment = assignmentBySeat.get(i);
            const guest = assignment ? guestMap.get(assignment.guestId) : null;
            const filled = !!guest;
            const isHovered = hoveredSeat === i;
            const isNeighbor = hoveredSeat !== null && neighborLinks.some((n) => n.seatIndex === i);
            const isTop = i < halfN;
            const lockPos = { x: pos.x, y: isTop ? pos.y - LOCK_OFFSET : pos.y + LOCK_OFFSET };

            return (
              <g key={i}>
                <g
                  onMouseEnter={() => setHoveredSeat(filled ? i : null)}
                  onMouseDown={(e) => filled && e.stopPropagation()}
                  onClick={() => filled && openSwap(i)}
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
                    dx={1}
                    fill={filled ? '#1f2937' : '#9ca3af'}
                  >
                    {filled ? (guest!.name.length > 10 ? guest!.name.slice(0, 9) + '.' : guest!.name) : i + 1}
                  </text>
                </g>
                {filled && (assignment!.locked || isHovered) && (
                  <SeatLock
                    x={lockPos.x}
                    y={lockPos.y}
                    locked={!!assignment!.locked}
                    onToggle={() => toggleLock(i)}
                  />
                )}
              </g>
            );
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
              bx = midX;
              by = midY;
            } else if (n.weight === 1) {
              const outwardY = hoveredIsTop ? midY - 65 : midY + 65;
              bx = (from.x + 2 * midX + to.x) / 4;
              by = (from.y + 2 * outwardY + to.y) / 4;
            } else {
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
        {swapAssignment && swapPos && (
          <SwapMenu
            key={swapSeat}
            x={swapPos.x}
            y={swapPos.y + seatRadius + 8}
            guests={guests}
            excludeGuestId={swapAssignment.guestId}
            onSelect={(otherId) => swapWith(swapSeat!, otherId)}
            onClose={closeSwap}
          />
        )}
      </div>
    </div>
  );
}
