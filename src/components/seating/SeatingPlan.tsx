import { useAppState } from '../../state/AppContext';
import { OptimizerPanel } from '../optimizer/OptimizerPanel';
import { RoundTableSvg } from './RoundTableSvg';
import { RectTableSvg } from './RectTableSvg';
import styles from './SeatingPlan.module.css';

export function SeatingPlan() {
  const { guests, tables, assignments } = useAppState();

  const guestMap = new Map(guests.map((g) => [g.id, g]));

  const getTableAssignments = (tableId: string) =>
    assignments.filter((a) => a.tableId === tableId);

  return (
    <div>
      <OptimizerPanel />

      {assignments.length > 0 && (
        <div className={styles.grid}>
          {tables.map((table) => {
            const tableAssignments = getTableAssignments(table.id);
            return table.shape === 'round' ? (
              <RoundTableSvg
                key={table.id}
                table={table}
                assignments={tableAssignments}
                guestMap={guestMap}
              />
            ) : (
              <RectTableSvg
                key={table.id}
                table={table}
                assignments={tableAssignments}
                guestMap={guestMap}
              />
            );
          })}
        </div>
      )}

      {assignments.length === 0 && tables.length > 0 && guests.length > 0 && (
        <p className={styles.empty}>
          Lancez l'optimisation pour voir le plan de table.
        </p>
      )}
    </div>
  );
}
