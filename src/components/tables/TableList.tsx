import { useState } from 'react';
import type { TableShape } from '../../types';
import { useAppDispatch, useAppState } from '../../state/AppContext';
import styles from './TableList.module.css';

function normalizeSeats(shape: TableShape, seats: number): number {
  const min = shape === 'square' ? 4 : 2;
  let s = Math.max(min, seats);
  if (shape === 'rectangular' && s % 2 !== 0) s += 1;
  if (shape === 'square' && s % 4 !== 0) s = Math.ceil(s / 4) * 4;
  return s;
}

const SHAPE_LABELS: Record<TableShape, string> = {
  round: 'Ronde',
  rectangular: 'Rectangulaire',
  square: 'Carrée',
  custom: 'Personnalisée',
};

function CustomSidesInput({
  sides,
  onChange,
}: {
  sides: [number, number, number, number];
  onChange: (sides: [number, number, number, number]) => void;
}) {
  return (
    <div className={styles.customSides}>
      {sides.map((val, i) => (
        <span key={i} className={styles.customSideEntry}>
          {i > 0 && <span className={styles.customSideX}>x</span>}
          <input
            type="number"
            value={val}
            onChange={(e) => {
              const v = Math.max(0, e.target.valueAsNumber || 0);
              const newSides = [...sides] as [number, number, number, number];
              newSides[i] = v;
              const total = newSides[0] + newSides[1] + newSides[2] + newSides[3];
              if (total >= 2) onChange(newSides);
            }}
            min={0}
            max={10}
            className={styles.customSideInput}
          />
        </span>
      ))}
    </div>
  );
}

export function TableList() {
  const { tables, guests } = useAppState();
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const [shape, setShape] = useState<TableShape>('round');
  const [seats, setSeats] = useState(8);
  const [customSides, setCustomSides] = useState<[number, number, number, number]>([2, 2, 2, 2]);

  const totalSeats = tables.reduce((sum, t) => sum + t.seats, 0);
  const diff = totalSeats - guests.length;

  const handleAdd = () => {
    const n = name.trim() || `Table ${tables.length + 1}`;
    if (shape === 'custom') {
      const total = customSides[0] + customSides[1] + customSides[2] + customSides[3];
      dispatch({ type: 'ADD_TABLE', payload: { name: n, shape, seats: total, customSides } });
    } else {
      const s = normalizeSeats(shape, seats);
      dispatch({ type: 'ADD_TABLE', payload: { name: n, shape, seats: s } });
    }
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
    updatedSeats: number,
    updatedCustomSides?: [number, number, number, number]
  ) => {
    dispatch({
      type: 'UPDATE_TABLE',
      payload: { id, name: updatedName, shape: updatedShape, seats: updatedSeats, customSides: updatedCustomSides },
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
          {Object.entries(SHAPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {shape !== 'custom' ? (
          <>
            <input
              type="number"
              value={seats}
              onChange={(e) => {
                const v = e.target.valueAsNumber;
                if (!Number.isNaN(v)) setSeats(v);
              }}
              onBlur={() => setSeats(normalizeSeats(shape, seats))}
              min={2}
              max={30}
              className={styles.numberInput}
            />
            <span className={styles.seatsLabel}>places</span>
          </>
        ) : (
          <CustomSidesInput sides={customSides} onChange={setCustomSides} />
        )}
        <button onClick={handleAdd} className={styles.addBtn}>
          Ajouter
        </button>
      </div>

      <div className={styles.list}>
        {tables.map((t) => (
          <TableRow
            key={t.id}
            table={t}
            onUpdate={handleUpdate}
            onRemove={handleRemove}
          />
        ))}
        {tables.length === 0 && (
          <p className={styles.empty}>Aucune table. Ajoutez-en une ci-dessus.</p>
        )}
      </div>
    </div>
  );
}

function TableRow({
  table: t,
  onUpdate,
  onRemove,
}: {
  table: { id: string; name: string; shape: TableShape; seats: number; customSides?: [number, number, number, number] };
  onUpdate: (id: string, name: string, shape: TableShape, seats: number, customSides?: [number, number, number, number]) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className={styles.tableRow}>
      <input
        className={styles.tableNameInput}
        value={t.name}
        onChange={(e) => onUpdate(t.id, e.target.value, t.shape, t.seats, t.customSides)}
      />
      <select
        value={t.shape}
        onChange={(e) => {
          const newShape = e.target.value as TableShape;
          if (newShape === 'custom') {
            const perSide = Math.max(1, Math.floor(t.seats / 4));
            const sides: [number, number, number, number] = [perSide, perSide, perSide, perSide];
            onUpdate(t.id, t.name, newShape, sides[0] + sides[1] + sides[2] + sides[3], sides);
          } else {
            const s = normalizeSeats(newShape, t.seats);
            onUpdate(t.id, t.name, newShape, s);
          }
        }}
        className={styles.tableSelect}
      >
        {Object.entries(SHAPE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      {t.shape !== 'custom' ? (
        <>
          <input
            type="number"
            value={t.seats}
            onChange={(e) => {
              const v = e.target.valueAsNumber;
              if (!Number.isNaN(v)) onUpdate(t.id, t.name, t.shape, v, t.customSides);
            }}
            onBlur={() => {
              const s = normalizeSeats(t.shape, t.seats);
              if (s !== t.seats) onUpdate(t.id, t.name, t.shape, s, t.customSides);
            }}
            min={2}
            max={30}
            className={styles.tableNumberInput}
          />
          <span className={styles.seatsLabel}>places</span>
        </>
      ) : (
        <CustomSidesInput
          sides={t.customSides ?? [2, 2, 2, 2]}
          onChange={(sides) => {
            const total = sides[0] + sides[1] + sides[2] + sides[3];
            onUpdate(t.id, t.name, t.shape, total, sides);
          }}
        />
      )}
      <button onClick={() => onRemove(t.id)} className={styles.removeBtn}>
        ✕
      </button>
    </div>
  );
}
