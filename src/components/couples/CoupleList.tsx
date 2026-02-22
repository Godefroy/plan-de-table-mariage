import { useState } from 'react';
import { useAppDispatch, useAppState } from '../../state/AppContext';
import styles from './CoupleList.module.css';

export function CoupleList() {
  const { guests, couples } = useAppState();
  const dispatch = useAppDispatch();
  const [guest1, setGuest1] = useState('');
  const [guest2, setGuest2] = useState('');

  const guestMap = new Map(guests.map((g) => [g.id, g]));
  const takenIds = new Set(couples.flatMap((c) => [c.guestId1, c.guestId2]));
  const availableGuests = guests.filter((g) => !takenIds.has(g.id));

  const handleAdd = () => {
    if (!guest1 || !guest2 || guest1 === guest2) return;
    dispatch({ type: 'ADD_COUPLE', payload: { guestId1: guest1, guestId2: guest2 } });
    setGuest1('');
    setGuest2('');
  };

  const handleRemove = (guestId1: string, guestId2: string) => {
    dispatch({ type: 'REMOVE_COUPLE', payload: { guestId1, guestId2 } });
  };

  return (
    <div className={styles.container}>
      <h2>Couples ({couples.length})</h2>
      <p className={styles.hint}>
        Les couples seront toujours placés l'un à côté de l'autre.
      </p>

      <div className={styles.addForm}>
        <select
          value={guest1}
          onChange={(e) => setGuest1(e.target.value)}
          className={styles.select}
        >
          <option value="">-- Invité 1 --</option>
          {availableGuests.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <span className={styles.heart}>&amp;</span>
        <select
          value={guest2}
          onChange={(e) => setGuest2(e.target.value)}
          className={styles.select}
        >
          <option value="">-- Invité 2 --</option>
          {availableGuests
            .filter((g) => g.id !== guest1)
            .map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
        </select>
        <button onClick={handleAdd} className={styles.addBtn}>
          Ajouter
        </button>
      </div>

      <div className={styles.list}>
        {couples.map((c) => (
          <div key={`${c.guestId1}-${c.guestId2}`} className={styles.coupleRow}>
            <span>
              {guestMap.get(c.guestId1)?.name ?? '?'}{' '}
              &amp;{' '}
              {guestMap.get(c.guestId2)?.name ?? '?'}
            </span>
            <button
              onClick={() => handleRemove(c.guestId1, c.guestId2)}
              className={styles.removeBtn}
            >
              ✕
            </button>
          </div>
        ))}
        {couples.length === 0 && (
          <p className={styles.empty}>Aucun couple défini.</p>
        )}
      </div>
    </div>
  );
}
