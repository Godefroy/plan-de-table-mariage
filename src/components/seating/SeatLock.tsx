interface Props {
  x: number;
  y: number;
  locked: boolean;
  onToggle: () => void;
}

export function SeatLock({ x, y, locked, onToggle }: Props) {
  return (
    <g
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      style={{ cursor: 'pointer' }}
    >
      <circle
        cx={x}
        cy={y}
        r={10}
        fill="white"
        stroke={locked ? '#db2777' : '#d1d5db'}
        strokeWidth={1.5}
      />
      <text
        x={x}
        y={y + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        style={{ userSelect: 'none', pointerEvents: 'none' }}
      >
        {locked ? '🔒' : '🔓'}
      </text>
    </g>
  );
}
