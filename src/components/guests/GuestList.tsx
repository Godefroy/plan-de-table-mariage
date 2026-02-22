import { useState } from 'react';
import { useAppDispatch, useAppState } from '../../state/AppContext';
import { GuestRow } from './GuestRow';
import styles from './GuestList.module.css';

export function GuestList() {
  const { guests } = useAppState();
  const dispatch = useAppDispatch();
  const [newName, setNewName] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    dispatch({ type: 'ADD_GUEST', payload: { name } });
    setNewName('');
  };

  const handleBulkImport = () => {
    const names = bulkText
      .split('\n')
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
    if (names.length === 0) return;
    for (const name of names) {
      dispatch({ type: 'ADD_GUEST', payload: { name } });
    }
    setBulkText('');
    setBulkOpen(false);
  };

  return (
    <div className={styles.container}>
      <h2>Invités ({guests.length})</h2>
      <div className={styles.addForm}>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Nom de l'invité"
          className={styles.input}
        />
        <button onClick={handleAdd} className={styles.addBtn}>
          Ajouter
        </button>
        <button
          onClick={() => setBulkOpen(!bulkOpen)}
          className={styles.bulkToggle}
        >
          {bulkOpen ? 'Fermer' : 'Import liste'}
        </button>
      </div>
      {bulkOpen && (
        <div className={styles.bulkPanel}>
          <textarea
            className={styles.bulkTextarea}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={"Un nom par ligne :\nJean Dupont\nMarie Martin\nPierre Durand"}
            rows={6}
          />
          <button onClick={handleBulkImport} className={styles.addBtn}>
            Importer {bulkText.split('\n').filter((n) => n.trim()).length || ''} invité(s)
          </button>
        </div>
      )}
      <div className={styles.list}>
        {guests.map((guest) => (
          <GuestRow key={guest.id} guest={guest} />
        ))}
        {guests.length === 0 && (
          <p className={styles.empty}>Aucun invité. Ajoutez-en un ci-dessus.</p>
        )}
      </div>
    </div>
  );
}
