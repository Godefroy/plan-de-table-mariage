import { useState } from 'react';
import type { TableShape } from '../../types';
import { useAppDispatch, useAppState } from '../../state/AppContext';
import styles from './TableList.module.css';

export function TableList() {
  const { tables, guests } = useAppState();
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const [shape, setShape] = useState<TableShape>('round');
  const [seats, setSeats] = useState(8);

  const totalSeats = tables.reduce((sum, t) => sum + t.seats, 0);
  const diff = totalSeats - guests.length;

  const handleAdd = () => {
    const n = name.trim() || `Table ${tables.length + 1}`;
    const s = shape === 'rectangular' && seats % 2 !== 0 ? seats + 1 : seats;
    dispatch({ type: 'ADD_TABLE', payload: { name: n, shape, seats: s } });
    setName('');
    setSeats(8);
  };

  const handleRemove = (id: string) => {
    dispatch({ type: 'REMOVE_TABLE', payload: { id } });
  };

  const handleUpdate = (
    id: string,
    updatedName: string,
    updatedShape: TableShape,
    updatedSeats: number
  ) => {
    dispatch({
      type: 'UPDATE_TABLE',
      payload: { id, name: updatedName, shape: updatedShape, seats: updatedSeats },
    });
  };

  return (
    <div className={styles.container}>
      <h2>Tables ({tables.length})</h2>

      <div className={styles.summary}>
        <span>
          {totalSeats} places / {guests.length} invités
        </span>
        {guests.length > 0 && (
          <span className={diff >= 0 ? styles.ok : styles.warn}>
            {diff >= 0 ? `(${diff} places libres)` : `(${Math.abs(diff)} places manquantes !)`}
          </span>
        )}
      </div>

      <div className={styles.addForm}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom de la table"
          className={styles.input}
        />
        <select
          value={shape}
          onChange={(e) => setShape(e.target.value as TableShape)}
          className={styles.select}
        >
          <option value="round">Ronde</option>
          <option value="rectangular">Rectangulaire</option>
        </select>
        <input
          type="number"
          value={seats}
          onChange={(e) => {
            const v = e.target.valueAsNumber;
            if (!Number.isNaN(v)) setSeats(Math.max(2, v));
          }}
          min={2}
          max={30}
          className={styles.numberInput}
        />
        <span className={styles.seatsLabel}>places</span>
        <button onClick={handleAdd} className={styles.addBtn}>
          Ajouter
        </button>
      </div>

      <div className={styles.list}>
        {tables.map((t) => (
          <div key={t.id} className={styles.tableRow}>
            <input
              className={styles.tableNameInput}
              value={t.name}
              onChange={(e) => handleUpdate(t.id, e.target.value, t.shape, t.seats)}
            />
            <select
              value={t.shape}
              onChange={(e) => {
                const newShape = e.target.value as TableShape;
                const s = newShape === 'rectangular' && t.seats % 2 !== 0 ? t.seats + 1 : t.seats;
                handleUpdate(t.id, t.name, newShape, s);
              }}
              className={styles.tableSelect}
            >
              <option value="round">Ronde</option>
              <option value="rectangular">Rectangulaire</option>
            </select>
            <input
              type="number"
              value={t.seats}
              onChange={(e) => {
                const v = e.target.valueAsNumber;
                if (!Number.isNaN(v)) handleUpdate(t.id, t.name, t.shape, Math.max(2, v));
              }}
              min={2}
              max={30}
              step={t.shape === 'rectangular' ? 2 : 1}
              className={styles.tableNumberInput}
            />
            <span className={styles.seatsLabel}>places</span>
            <button onClick={() => handleRemove(t.id)} className={styles.removeBtn}>
              ✕
            </button>
          </div>
        ))}
        {tables.length === 0 && (
          <p className={styles.empty}>Aucune table. Ajoutez-en une ci-dessus.</p>
        )}
      </div>
    </div>
  );
}
