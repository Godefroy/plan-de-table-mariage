import { useAppState } from '../../state/AppContext';
import { AffinityCell } from './AffinityCell';
import styles from './AffinityMatrix.module.css';

export function AffinityMatrix() {
  const { guests, affinities } = useAppState();

  const affinityMap = new Map<string, number>();
  for (const a of affinities) {
    affinityMap.set(`${a.guestId1}|${a.guestId2}`, a.score);
  }

  const getScore = (id1: string, id2: string): number => {
    const key = id1 < id2 ? `${id1}|${id2}` : `${id2}|${id1}`;
    return affinityMap.get(key) ?? 0;
  };

  if (guests.length < 2) {
    return (
      <div className={styles.container}>
        <h2>Affinités</h2>
        <p className={styles.empty}>
          Ajoutez au moins 2 invités pour définir les affinités.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2>Affinités</h2>
      <p className={styles.hint}>
        Cliquez sur une cellule pour changer le score (-3 à +3).
        <br />
        <span className={styles.legend}>
          <span className={styles.legendNeg}>-3</span> Incompatible →
          <span className={styles.legendZero}>0</span> Neutre →
          <span className={styles.legendPos}>+3</span> Très proches
        </span>
      </p>
      <div className={styles.tableWrapper}>
        <table className={styles.matrix}>
          <thead>
            <tr>
              <th className={styles.cornerCell}></th>
              {guests.map((g) => (
                <th key={g.id} className={styles.headerCell}>
                  <span className={styles.headerText}>{g.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {guests.map((g1, i) => (
              <tr key={g1.id}>
                <td className={styles.rowHeader}>{g1.name}</td>
                {guests.map((g2, j) => (
                  <td key={g2.id} className={styles.cell}>
                    {j > i ? (
                      <AffinityCell
                        guestId1={g1.id}
                        guestId2={g2.id}
                        score={getScore(g1.id, g2.id)}
                      />
                    ) : j === i ? (
                      <span className={styles.diagonal}>-</span>
                    ) : (
                      <span className={styles.mirror}>
                        {getScore(g1.id, g2.id) || ''}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
