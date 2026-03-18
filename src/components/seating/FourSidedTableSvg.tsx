import { useMemo } from 'react';
import type { Table, SeatAssignment, Guest } from '../../types';
import { getTableSides } from '../../optimizer/adjacency';
import { useTableInteraction } from './useTableInteraction';
import { getLinkColor, getBadgeBg } from './tableUtils';
import styles from './SeatingPlan.module.css';

interface Props {
  table: Table;
  assignments: SeatAssignment[];
  guestMap: Map<string, Guest>;
}

export function FourSidedTableSvg({ table, assignments, guestMap }: Props) {
  const {
    hoveredSeat, setHoveredSeat, assignmentBySeat,
    hoveredGuestId, neighborLinks,
    isCouple, getAffinity, handleScoreClick, handleScoreContextMenu,
  } = useTableInteraction(table, assignments, guestMap);

  const sides = getTableSides(table.shape, table.seats, table.customSides) ?? [1, 1, 1, 1];
  const [top, right, bottom, left] = sides;

  const seatRadius = 26;
  const seatSpacing = 58;
  const padding = 40;

  const maxH = Math.max(top, bottom, 1);
  const maxV = Math.max(left, right, 1);
  const tableW = Math.max((maxH - 1) * seatSpacing, 60);
  const tableH = Math.max((maxV - 1) * seatSpacing, 60);
  const seatOffset = seatRadius + 14;

  const svgW = tableW + 2 * (seatOffset + seatRadius) + padding;
  const svgH = tableH + 2 * (seatOffset + seatRadius) + padding;
  const cx = svgW / 2;
  const cy = svgH / 2;
  const halfW = tableW / 2;
  const halfH = tableH / 2;

  const seatPositions = useMemo(() => {
    const positions = new Map<number, { x: number; y: number }>();
    let idx = 0;

    // Top: left to right
    for (let i = 0; i < top; i++) {
      const x = top <= 1 ? cx : cx - halfW + (i / (top - 1)) * 2 * halfW;
      positions.set(idx++, { x, y: cy - halfH - seatOffset });
    }
    // Right: top to bottom
    for (let i = 0; i < right; i++) {
      const y = right <= 1 ? cy : cy - halfH + (i / (right - 1)) * 2 * halfH;
      positions.set(idx++, { x: cx + halfW + seatOffset, y });
    }
    // Bottom: right to left
    for (let i = 0; i < bottom; i++) {
      const x = bottom <= 1 ? cx : cx + halfW - (i / (bottom - 1)) * 2 * halfW;
      positions.set(idx++, { x, y: cy + halfH + seatOffset });
    }
    // Left: bottom to top
    for (let i = 0; i < left; i++) {
      const y = left <= 1 ? cy : cy + halfH - (i / (left - 1)) * 2 * halfH;
      positions.set(idx++, { x: cx - halfW - seatOffset, y });
    }

    return positions;
  }, [top, right, bottom, left, cx, cy, halfW, halfH, seatOffset]);

  const cumulative = useMemo(() => [0, top, top + right, top + right + bottom, top + right + bottom + left], [top, right, bottom, left]);

  const getSide = (seatIdx: number): number => {
    for (let s = 0; s < 4; s++) {
      if (seatIdx >= cumulative[s] && seatIdx < cumulative[s + 1]) return s;
    }
    return -1;
  };

  // Badge on the perpendicular bisector of from–to, offset outward from table center.
  // Curve control point derived so the bezier passes through badge at t=0.5.
  const computeLinkGeometry = (fromIdx: number, toIdx: number, weight: number) => {
    const from = seatPositions.get(fromIdx)!;
    const to = seatPositions.get(toIdx)!;
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;

    // Perpendicular to the from–to segment (true bisector direction)
    const segDx = to.x - from.x;
    const segDy = to.y - from.y;
    const segLen = Math.sqrt(segDx * segDx + segDy * segDy) || 1;
    let px = -segDy / segLen;
    let py = segDx / segLen;

    // Orient outward (away from table center)
    if (px * (midX - cx) + py * (midY - cy) < 0) {
      px = -px;
      py = -py;
    }

    const fromSide = getSide(fromIdx);
    const toSide = getSide(toIdx);
    const sameSide = fromSide === toSide;

    // Positive = outward, negative = inward
    let offset: number;
    if (sameSide && weight === 1) {
      offset = 30;
    } else if (sameSide) {
      offset = -42;  // inward to avoid the intermediate seat
    } else if (weight === 1) {
      offset = 36;   // corner direct: further out to clear seats
    } else {
      offset = -28;  // corner indirect: inward side of the table
    }

    const bx = midX + px * offset;
    const by = midY + py * offset;

    // CP so bezier midpoint (t=0.5) = badge: CP = 2*badge − mid
    const cpX = 2 * bx - midX;
    const cpY = 2 * by - midY;
    const d = `M ${from.x},${from.y} Q ${cpX},${cpY} ${to.x},${to.y}`;

    return { bx, by, d };
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
          {/* Table shape */}
          <rect
            x={cx - halfW}
            y={cy - halfH}
            width={tableW}
            height={tableH}
            rx={8}
            fill="#fdf2f8"
            stroke="#f9a8d4"
            strokeWidth={2}
          />

          {/* Links on hover */}
          {hoveredSeat !== null && hoveredGuestId && neighborLinks.map((n) => {
            const { d } = computeLinkGeometry(hoveredSeat, n.seatIndex, n.weight);
            const couple = isCouple(hoveredGuestId, n.guestId);
            const score = getAffinity(hoveredGuestId, n.guestId);
            const color = couple ? '#e11d48' : getLinkColor(score);

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
          {Array.from(seatPositions.entries()).map(([i, pos]) => {
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
            const { bx, by } = computeLinkGeometry(hoveredSeat, n.seatIndex, n.weight);
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
