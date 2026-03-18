import { useState } from 'react';
import { useAppDispatch, useAppState } from '../../state/AppContext';
import { optimize } from '../../optimizer/engine';
import { computeScore } from '../../optimizer/scoring';
import styles from './OptimizerPanel.module.css';

export function OptimizerPanel() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ pass: number; totalPasses: number; score: number } | null>(null);

  const { guests, tables, affinities, couples, assignments } = state;
  const totalSeats = tables.reduce((sum, t) => sum + t.seats, 0);
  const canRun = guests.length >= 2 && tables.length >= 1 && totalSeats >= guests.length;

  const currentScore =
    assignments.length > 0
      ? computeScore(assignments, tables, affinities, couples, guests)
      : null;

  const handleOptimize = () => {
    setRunning(true);
    setProgress(null);

    // Use setTimeout to let the UI update before running the sync optimizer
    setTimeout(() => {
      try {
        const result = optimize(
          guests,
          tables,
          affinities,
          couples,
          undefined,
          (pass, totalPasses, score) => setProgress({ pass, totalPasses, score }),
          assignments
        );
        dispatch({ type: 'SET_ASSIGNMENTS', payload: result });
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Erreur lors de l\'optimisation');
      }
      setRunning(false);
    }, 50);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.info}>
        <span>{guests.length} invités</span>
        <span>{tables.length} tables</span>
        <span>{totalSeats} places</span>
        {currentScore !== null && (
          <span className={styles.score}>Score : {currentScore}</span>
        )}
      </div>

      {!canRun && (
        <p className={styles.warn}>
          {guests.length < 2 && 'Ajoutez au moins 2 invités. '}
          {tables.length < 1 && 'Ajoutez au moins 1 table. '}
          {totalSeats < guests.length &&
            `Il manque ${guests.length - totalSeats} place(s). `}
        </p>
      )}

      <button
        onClick={handleOptimize}
        disabled={!canRun || running}
        className={styles.runBtn}
      >
        {running ? 'Optimisation en cours...' : 'Optimiser le placement'}
      </button>

      {running && progress && (
        <div className={styles.progress}>
          Passe {progress.pass}/{progress.totalPasses} — Meilleur score : {progress.score}
        </div>
      )}

      {assignments.length > 0 && !running && (
        <button
          onClick={() => dispatch({ type: 'CLEAR_ASSIGNMENTS' })}
          className={styles.clearBtn}
        >
          Effacer le placement
        </button>
      )}
    </div>
  );
}
