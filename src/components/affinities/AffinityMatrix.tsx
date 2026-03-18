import { useRef, useState } from 'react';
import { useAppState } from '../../state/AppContext';
import { AffinityCell } from './AffinityCell';
import styles from './AffinityMatrix.module.css';

export function AffinityMatrix() {
  const { guests, affinities, couples } = useAppState();
  const [hovered, setHovered] = useState<{ row: number; col: number } | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (headerRef.current && wrapperRef.current) {
      headerRef.current.scrollLeft = wrapperRef.current.scrollLeft;
    }
  };

  const affinityMap = new Map<string, number>();
  for (const a of affinities) {
    affinityMap.set(`${a.guestId1}|${a.guestId2}`, a.score);
  }

  const coupleSet = new Set<string>();
  for (const c of couples) {
    const key = c.guestId1 < c.guestId2
      ? `${c.guestId1}|${c.guestId2}`
      : `${c.guestId2}|${c.guestId1}`;
    coupleSet.add(key);
  }

  const isCouple = (id1: string, id2: string): boolean => {
    const key = id1 < id2 ? `${id1}|${id2}` : `${id2}|${id1}`;
    return coupleSet.has(key);
  };

  const getScore = (id1: string, id2: string): number => {
    const key = id1 < id2 ? `${id1}|${id2}` : `${id2}|${id1}`;
    return affinityMap.get(key) ?? 0;
  };

  const sortedGuests = [...guests].sort((a, b) => a.name.localeCompare(b.name));

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
      <div ref={headerRef} className={styles.columnHeaders}>
        <div className={styles.headerSpacer}></div>
        {sortedGuests.map((g, j) => (
          <div
            key={g.id}
            className={`${styles.colHeader}${hovered?.col === j ? ` ${styles.colHeaderHighlight}` : ''}`}
          >
            <span className={styles.headerText}>{g.name}</span>
          </div>
        ))}
        <div className={styles.headerEndSpacer}></div>
      </div>
      <div ref={wrapperRef} className={styles.tableWrapper} onScroll={handleScroll}>
        <table className={styles.matrix}>
          <tbody>
            {sortedGuests.map((g1, i) => (
              <tr key={g1.id}>
                <td className={`${styles.rowHeader}${hovered?.row === i ? ` ${styles.rowHeaderHighlight}` : ''}`}>{g1.name}</td>
                {sortedGuests.map((g2, j) => (
                  <td
                    key={g2.id}
                    className={styles.cell}
                    onMouseEnter={() => setHovered({ row: i, col: j })}
                    onMouseLeave={() => setHovered(null)}
                  >
                    {j === i ? (
                      <span className={styles.diagonal}>-</span>
                    ) : isCouple(g1.id, g2.id) ? (
                      <span className={styles.coupleHeart} title="Couple">❤️</span>
                    ) : (
                      <AffinityCell
                        guestId1={g1.id}
                        guestId2={g2.id}
                        score={getScore(g1.id, g2.id)}
                      />
                    )}
                  </td>
                ))}
                <td className={styles.endSpacer}></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
