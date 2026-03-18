import { useMemo } from 'react';
import type { Table, SeatAssignment, Guest } from '../../types';
import { useTableInteraction } from './useTableInteraction';
import { getLinkColor, getBadgeBg } from './tableUtils';
import styles from './SeatingPlan.module.css';

interface Props {
  table: Table;
  assignments: SeatAssignment[];
  guestMap: Map<string, Guest>;
}

export function RoundTableSvg({ table, assignments, guestMap }: Props) {
  const {
    hoveredSeat, setHoveredSeat, assignmentBySeat,
    hoveredGuestId, neighborLinks,
    isCouple, getAffinity, handleScoreClick, handleScoreContextMenu,
  } = useTableInteraction(table, assignments, guestMap);

  const size = 340;
  const cx = size / 2;
  const cy = size / 2;
  const tableRadius = 65;
  const seatRadius = 26;
  const seatOrbitRadius = tableRadius + seatRadius + 12;

  const seatPositions = useMemo(() =>
    Array.from({ length: table.seats }, (_, i) => {
      const angle = (2 * Math.PI * i) / table.seats - Math.PI / 2;
      return {
        x: cx + seatOrbitRadius * Math.cos(angle),
        y: cy + seatOrbitRadius * Math.sin(angle),
      };
    }),
  [table.seats, cx, cy, seatOrbitRadius]);

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
              cpX = midX + (midX - cx) * 0.5;
              cpY = midY + (midY - cy) * 0.5;
            } else {
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
                style={{ cursor: 'default' }}
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
