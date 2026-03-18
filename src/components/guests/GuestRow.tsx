import { useEffect, useRef, useState } from 'react';
import type { Guest } from '../../types';
import { useAppDispatch, useAppState } from '../../state/AppContext';
import styles from './GuestRow.module.css';

interface GuestRowProps {
  guest: Guest;
  partner?: Guest;
  availableSingles: Guest[];
}

export function GuestRow({ guest, partner, availableSingles }: GuestRowProps) {
  const { languages } = useAppState();
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(guest.name);
  const [coupleOpen, setCoupleOpen] = useState(false);
  const [coupleSearch, setCoupleSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const comboRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!coupleOpen) return;
    const handler = (e: MouseEvent) => {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
        setCoupleOpen(false);
        setCoupleSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [coupleOpen]);

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

  const handleSelectPartner = (partnerId: string) => {
    dispatch({ type: 'ADD_COUPLE', payload: { guestId1: guest.id, guestId2: partnerId } });
    setCoupleOpen(false);
    setCoupleSearch('');
  };

  const handleCreateAndCouple = (name: string) => {
    const id = crypto.randomUUID();
    dispatch({ type: 'ADD_GUEST', payload: { name, id } });
    dispatch({ type: 'ADD_COUPLE', payload: { guestId1: guest.id, guestId2: id } });
    setCoupleOpen(false);
    setCoupleSearch('');
  };

  const filtered = availableSingles
    .filter((g) => g.id !== guest.id)
    .filter((g) => !coupleSearch || g.name.toLowerCase().includes(coupleSearch.toLowerCase()));
  const trimmedSearch = coupleSearch.trim();
  const exactMatch = availableSingles.some((g) => g.name.toLowerCase() === trimmedSearch.toLowerCase());

  return (
    <div className={styles.row}>
      <div className={styles.main}>
        <input
          className={styles.editInput}
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          }}
          onBlur={handleSave}
        />
        {!partner && !coupleOpen && (
          <button
            className={styles.coupleBtn}
            onClick={() => {
              setCoupleOpen(true);
              setTimeout(() => inputRef.current?.focus(), 0);
            }}
          >
            Ajouter conjoint(e)
          </button>
        )}
        {!partner && coupleOpen && (
          <div ref={comboRef} className={styles.comboWrapper}>
            <input
              ref={inputRef}
              className={styles.comboInput}
              value={coupleSearch}
              onChange={(e) => setCoupleSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setCoupleOpen(false);
                  setCoupleSearch('');
                }
                if (e.key === 'Enter' && trimmedSearch && !exactMatch) {
                  handleCreateAndCouple(trimmedSearch);
                }
              }}
              placeholder="Rechercher ou créer..."
            />
            <div className={styles.comboDropdown}>
              {filtered.map((g) => (
                <button
                  key={g.id}
                  className={styles.comboOption}
                  onMouseDown={() => handleSelectPartner(g.id)}
                >
                  {g.name}
                </button>
              ))}
              {trimmedSearch && !exactMatch && (
                <button
                  className={`${styles.comboOption} ${styles.comboCreate}`}
                  onMouseDown={() => handleCreateAndCouple(trimmedSearch)}
                >
                  Créer « {trimmedSearch} »
                </button>
              )}
              {filtered.length === 0 && !trimmedSearch && (
                <div className={styles.comboEmpty}>Aucun invité disponible</div>
              )}
            </div>

          </div>
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
