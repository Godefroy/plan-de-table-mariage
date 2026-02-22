import type { Table, SeatAssignment, Guest } from '../../types';
import styles from './SeatingPlan.module.css';

interface Props {
  table: Table;
  assignments: SeatAssignment[];
  guestMap: Map<string, Guest>;
}

export function RectTableSvg({ table, assignments, guestMap }: Props) {
  const halfN = Math.floor(table.seats / 2);
  const seatW = 56;
  const seatH = 30;
  const gap = 8;
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
          fill={filled ? '#ede9fe' : '#f9fafb'}
          stroke={filled ? '#7c3aed' : '#d1d5db'}
          strokeWidth={1.5}
        />
        <text
          x={x + seatW / 2}
          y={y + seatH / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={9}
          fill={filled ? '#5b21b6' : '#9ca3af'}
        >
          {filled
            ? guest!.name.length > 8
              ? guest!.name.slice(0, 7) + '.'
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
          fill="#faf5ff"
          stroke="#c4b5fd"
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
