import type { Table, SeatAssignment, Guest } from '../../types';
import styles from './SeatingPlan.module.css';

interface Props {
  table: Table;
  assignments: SeatAssignment[];
  guestMap: Map<string, Guest>;
}

export function RectTableSvg({ table, assignments, guestMap }: Props) {
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

  const topY = tableY - seatH - 8;
  const bottomY = tableY + tableH + 8;

  const assignmentBySeat = new Map<number, SeatAssignment>();
  for (const a of assignments) {
    assignmentBySeat.set(a.seatIndex, a);
  }

  const renderSeat = (seatIndex: number, x: number, y: number) => {
    const assignment = assignmentBySeat.get(seatIndex);
    const guest = assignment ? guestMap.get(assignment.guestId) : null;
    const filled = !!guest;

    return (
      <g key={seatIndex}>
        <rect
          x={x}
          y={y}
          width={seatW}
          height={seatH}
          rx={6}
          fill={filled ? '#fdf2f8' : '#f9fafb'}
          stroke={filled ? '#db2777' : '#d1d5db'}
          strokeWidth={1.5}
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
      <svg viewBox={`0 0 ${svgW} ${svgH}`} width={svgW} height={svgH}>
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

        {/* Top seats (indices 0 .. halfN-1) */}
        {Array.from({ length: halfN }, (_, i) => {
          const x = tableX + 10 + i * (seatW + gap);
          return renderSeat(i, x, topY);
        })}

        {/* Bottom seats (indices halfN .. seats-1) */}
        {Array.from({ length: halfN }, (_, i) => {
          const x = tableX + 10 + i * (seatW + gap);
          return renderSeat(halfN + i, x, bottomY);
        })}
      </svg>
    </div>
  );
}
