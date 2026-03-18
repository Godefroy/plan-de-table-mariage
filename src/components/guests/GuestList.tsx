import { useState } from 'react';
import { useAppDispatch, useAppState } from '../../state/AppContext';
import { GuestRow } from './GuestRow';
import type { Guest } from '../../types';
import styles from './GuestList.module.css';

export function GuestList() {
  const { guests, couples } = useAppState();
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

  // Build couple lookup
  const partnerMap = new Map<string, string>();
  for (const c of couples) {
    partnerMap.set(c.guestId1, c.guestId2);
    partnerMap.set(c.guestId2, c.guestId1);
  }

  const guestMap = new Map(guests.map((g) => [g.id, g]));
  const sorted = [...guests].sort((a, b) => a.name.localeCompare(b.name));

  // Singles (not in any couple)
  const singles = sorted.filter((g) => !partnerMap.has(g.id));

  // Couples: group by first alphabetically, deduplicate
  const seen = new Set<string>();
  const coupleGroups: { g1: Guest; g2: Guest }[] = [];
  for (const g of sorted) {
    if (seen.has(g.id)) continue;
    const partnerId = partnerMap.get(g.id);
    if (!partnerId) continue;
    const partner = guestMap.get(partnerId);
    if (!partner) continue;
    seen.add(g.id);
    seen.add(partnerId);
    coupleGroups.push({ g1: g, g2: partner });
  }

  const availableSingles = singles;

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
        {coupleGroups.map(({ g1, g2 }) => (
          <div key={`${g1.id}-${g2.id}`} className={styles.coupleGroup}>
            <GuestRow guest={g1} partner={g2} availableSingles={[]} />
            <button
              className={styles.unlinkBtn}
              onClick={() => dispatch({ type: 'REMOVE_COUPLE', payload: { guestId1: g1.id, guestId2: g2.id } })}
              title="Séparer le couple"
            >
              ✕
            </button>
            <GuestRow guest={g2} partner={g1} availableSingles={[]} />
          </div>
        ))}
        {singles.map((guest) => (
          <GuestRow key={guest.id} guest={guest} availableSingles={availableSingles} />
        ))}
        {guests.length === 0 && (
          <p className={styles.empty}>Aucun invité. Ajoutez-en un ci-dessus.</p>
        )}
      </div>
    </div>
  );
}
