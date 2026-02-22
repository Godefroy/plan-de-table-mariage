import { useState } from 'react';
import type { Guest } from '../../types';
import { useAppDispatch, useAppState } from '../../state/AppContext';
import styles from './GuestRow.module.css';

export function GuestRow({ guest }: { guest: Guest }) {
  const { languages } = useAppState();
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(guest.name);

  const handleSave = () => {
    const name = editName.trim();
    if (name && name !== guest.name) {
      dispatch({ type: 'UPDATE_GUEST', payload: { id: guest.id, name } });
    }
    setEditing(false);
  };

  const handleDelete = () => {
    dispatch({ type: 'REMOVE_GUEST', payload: { id: guest.id } });
  };

  const toggleLang = (langName: string) => {
    const has = guest.languages.includes(langName);
    const updated = has
      ? guest.languages.filter((l) => l !== langName)
      : [...guest.languages, langName];
    dispatch({ type: 'SET_GUEST_LANGUAGES', payload: { id: guest.id, languages: updated } });
  };

  return (
    <div className={styles.row}>
      <div className={styles.main}>
        {editing ? (
          <input
            className={styles.editInput}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') setEditing(false);
            }}
            onBlur={handleSave}
            autoFocus
          />
        ) : (
          <span className={styles.name} onClick={() => setEditing(true)}>
            {guest.name}
          </span>
        )}
        <div className={styles.flags}>
          {languages.map((lang) => (
            <button
              key={lang.name}
              className={`${styles.flagBtn} ${guest.languages.includes(lang.name) ? styles.flagActive : ''}`}
              onClick={() => toggleLang(lang.name)}
              title={lang.name}
            >
              {lang.flag}
            </button>
          ))}
        </div>
        <div className={styles.actions}>
          <button onClick={handleDelete} className={styles.deleteBtn} title="Supprimer">
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
