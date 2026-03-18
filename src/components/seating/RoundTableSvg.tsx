import { useState } from 'react';
import type { Table, SeatAssignment, Guest } from '../../types';
import styles from './SeatingPlan.module.css';

interface Props {
  table: Table;
  assignments: SeatAssignment[];
  guestMap: Map<string, Guest>;
}

export function RoundTableSvg({ table, assignments, guestMap }: Props) {
  const [tooltip, setTooltip] = useState<{ name: string; x: number; y: number } | null>(null);
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

  const handleMouseEnter = (e: React.MouseEvent<SVGGElement>, guest: Guest) => {
    const svg = e.currentTarget.closest('svg')!;
    const rect = svg.getBoundingClientRect();
    const point = svg.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;
    setTooltip({
      name: guest.name,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div className={styles.tableCard}>
      <h3 className={styles.tableName}>{table.name}</h3>
      <div className={styles.svgWrapper}>
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
          {/* Table circle */}
          <circle
            cx={cx}
            cy={cy}
            r={tableRadius}
            fill="#fdf2f8"
            stroke="#f9a8d4"
            strokeWidth={2}
          />

          {/* Seats */}
          {seatPositions.map((pos, i) => {
            const assignment = assignmentBySeat.get(i);
            const guest = assignment ? guestMap.get(assignment.guestId) : null;
            const filled = !!guest;

            return (
              <g
                key={i}
                onMouseEnter={guest ? (e) => handleMouseEnter(e, guest) : undefined}
                onMouseLeave={guest ? () => setTooltip(null) : undefined}
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={seatRadius}
                  fill={filled ? '#fdf2f8' : '#f9fafb'}
                  stroke={filled ? '#db2777' : '#d1d5db'}
                  strokeWidth={1.5}
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
        </svg>
        {tooltip && (
          <div className={styles.tooltip} style={{ left: tooltip.x, top: tooltip.y }}>
            {tooltip.name}
          </div>
        )}
      </div>
    </div>
  );
}
