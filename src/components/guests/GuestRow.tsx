import { useState } from 'react';
import type { Guest } from '../../types';
import { useAppDispatch } from '../../state/AppContext';
import { LanguageEditor } from './LanguageEditor';
import styles from './GuestRow.module.css';

export function GuestRow({ guest }: { guest: Guest }) {
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(guest.name);
  const [showLangs, setShowLangs] = useState(false);

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
          <span className={styles.name} onDoubleClick={() => setEditing(true)}>
            {guest.name}
          </span>
        )}
        <span className={styles.langBadge} onClick={() => setShowLangs(!showLangs)}>
          {guest.languages.length > 0
            ? guest.languages.map((l) => l.language).join(', ')
            : '+ langues'}
        </span>
        <div className={styles.actions}>
          <button onClick={() => setEditing(true)} className={styles.editBtn} title="Modifier">
            ✏
          </button>
          <button onClick={handleDelete} className={styles.deleteBtn} title="Supprimer">
            ✕
          </button>
        </div>
      </div>
      {showLangs && <LanguageEditor guest={guest} />}
    </div>
  );
}
