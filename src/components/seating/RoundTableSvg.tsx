import type { Table, SeatAssignment, Guest } from '../../types';
import styles from './SeatingPlan.module.css';

interface Props {
  table: Table;
  assignments: SeatAssignment[];
  guestMap: Map<string, Guest>;
}

export function RoundTableSvg({ table, assignments, guestMap }: Props) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const tableRadius = 60;
  const seatRadius = 18;
  const seatOrbitRadius = tableRadius + seatRadius + 10;
  const labelOrbitRadius = seatOrbitRadius + seatRadius + 8;

  const seatPositions = Array.from({ length: table.seats }, (_, i) => {
    const angle = (2 * Math.PI * i) / table.seats - Math.PI / 2;
    return {
      x: cx + seatOrbitRadius * Math.cos(angle),
      y: cy + seatOrbitRadius * Math.sin(angle),
      labelX: cx + labelOrbitRadius * Math.cos(angle),
      labelY: cy + labelOrbitRadius * Math.sin(angle),
      angle,
    };
  });

  const assignmentBySeat = new Map<number, SeatAssignment>();
  for (const a of assignments) {
    assignmentBySeat.set(a.seatIndex, a);
  }

  return (
    <div className={styles.tableCard}>
      <h3 className={styles.tableName}>{table.name}</h3>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        {/* Table circle */}
        <circle
          cx={cx}
          cy={cy}
          r={tableRadius}
          fill="#faf5ff"
          stroke="#c4b5fd"
          strokeWidth={2}
        />

        {/* Seats and labels */}
        {seatPositions.map((pos, i) => {
          const assignment = assignmentBySeat.get(i);
          const guest = assignment ? guestMap.get(assignment.guestId) : null;
          const filled = !!guest;

          return (
            <g key={i}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={seatRadius}
                fill={filled ? '#ede9fe' : '#f9fafb'}
                stroke={filled ? '#7c3aed' : '#d1d5db'}
                strokeWidth={1.5}
              />
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={9}
                fill={filled ? '#5b21b6' : '#9ca3af'}
              >
                {filled ? (guest!.name.length > 6 ? guest!.name.slice(0, 5) + '.' : guest!.name) : i + 1}
              </text>
              {guest && (
                <text
                  x={pos.labelX}
                  y={pos.labelY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={8}
                  fill="#4b5563"
                >
                  {guest.name.length > 10 ? guest.name.slice(0, 9) + '...' : guest.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
