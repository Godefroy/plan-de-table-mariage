import { useEffect, useMemo, useRef, useState } from 'react';
import type { Guest } from '../../types';
import styles from './SwapMenu.module.css';

interface Props {
  x: number;
  y: number;
  guests: Guest[];
  excludeGuestId: string;
  onSelect: (guestId: string) => void;
  onClose: () => void;
}

export function SwapMenu({ x, y, guests, excludeGuestId, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return guests
      .filter((g) => g.id !== excludeGuestId)
      .filter((g) => !q || g.name.toLowerCase().includes(q));
  }, [guests, excludeGuestId, query]);

  const handleEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filtered.length > 0) {
      e.preventDefault();
      onSelect(filtered[0].id);
    }
  };

  return (
    <div
      ref={ref}
      className={styles.menu}
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={styles.title}>Échanger avec :</div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleEnter}
        placeholder="Rechercher un invité…"
        className={styles.input}
        autoFocus
      />
      <ul className={styles.list}>
        {filtered.length === 0 ? (
          <li className={styles.empty}>Aucun invité</li>
        ) : (
          filtered.map((g) => (
            <li key={g.id}>
              <button
                type="button"
                className={styles.option}
                onClick={() => onSelect(g.id)}
              >
                {g.name}
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
