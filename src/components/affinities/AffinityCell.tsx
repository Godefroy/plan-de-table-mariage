import type { AffinityScore } from '../../types';
import { useAppDispatch } from '../../state/AppContext';
import styles from './AffinityCell.module.css';

const SCORE_CYCLE: AffinityScore[] = [0, 1, 2, 3, -1, -2, -3];

function getScoreColor(score: number): string {
  if (score === 0) return '#f9fafb';
  if (score > 0) {
    const intensity = score / 3;
    return `rgba(34, 197, 94, ${0.15 + intensity * 0.45})`;
  }
  const intensity = Math.abs(score) / 3;
  return `rgba(239, 68, 68, ${0.15 + intensity * 0.45})`;
}

export function AffinityCell({
  guestId1,
  guestId2,
  score,
}: {
  guestId1: string;
  guestId2: string;
  score: number;
}) {
  const dispatch = useAppDispatch();

  const handleClick = (e: React.MouseEvent) => {
    const currentIdx = SCORE_CYCLE.indexOf(score as AffinityScore);
    const nextIdx = e.shiftKey
      ? (currentIdx - 1 + SCORE_CYCLE.length) % SCORE_CYCLE.length
      : (currentIdx + 1) % SCORE_CYCLE.length;
    const nextScore = SCORE_CYCLE[nextIdx];

    dispatch({
      type: 'SET_AFFINITY',
      payload: { guestId1, guestId2, score: nextScore },
    });
  };

  return (
    <button
      className={styles.cell}
      style={{ background: getScoreColor(score) }}
      onClick={handleClick}
      title={`${score} (clic: +1, shift+clic: -1)`}
    >
      {score !== 0 ? (score > 0 ? `+${score}` : score) : ''}
    </button>
  );
}
