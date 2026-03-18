import { useAppState } from '../../state/AppContext';
import { OptimizerPanel } from '../optimizer/OptimizerPanel';
import { RoundTableSvg } from './RoundTableSvg';
import { RectTableSvg } from './RectTableSvg';
import { FourSidedTableSvg } from './FourSidedTableSvg';
import styles from './SeatingPlan.module.css';

export function SeatingPlan() {
  const { guests, tables, assignments } = useAppState();

  const guestMap = new Map(guests.map((g) => [g.id, g]));

  const getTableAssignments = (tableId: string) =>
    assignments.filter((a) => a.tableId === tableId);

  const renderTable = (table: typeof tables[number]) => {
    const tableAssignments = getTableAssignments(table.id);
    const props = { key: table.id, table, assignments: tableAssignments, guestMap };

    switch (table.shape) {
      case 'round':
        return <RoundTableSvg {...props} />;
      case 'rectangular':
        return <RectTableSvg {...props} />;
      case 'square':
      case 'custom':
        return <FourSidedTableSvg {...props} />;
    }
  };

  return (
    <div>
      <OptimizerPanel />

      {assignments.length > 0 && (
        <>
          <div className={styles.grid}>
            {tables.map(renderTable)}
          </div>
          <div className={styles.hint}>
            <strong>Astuce :</strong> survolez un invité pour voir ses scores d'affinité avec ses voisins.
            Cliquez sur un score pour le modifier (clic droit pour reculer).
            Après vos ajustements, relancez l'optimisation pour améliorer le plan.
          </div>
        </>
      )}

      {assignments.length === 0 && tables.length > 0 && guests.length > 0 && (
        <p className={styles.empty}>
          Lancez l'optimisation pour voir le plan de table.
        </p>
      )}
    </div>
  );
}
