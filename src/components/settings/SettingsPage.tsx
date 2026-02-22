import { useState } from 'react';
import { useAppDispatch, useAppState } from '../../state/AppContext';
import styles from './SettingsPage.module.css';

const ALL_LANGUAGES = [
  { name: 'Français', flag: '🇫🇷' },
  { name: 'English', flag: '🇬🇧' },
  { name: 'Español', flag: '🇪🇸' },
  { name: 'Deutsch', flag: '🇩🇪' },
  { name: 'Italiano', flag: '🇮🇹' },
  { name: 'Português', flag: '🇵🇹' },
  { name: 'Nederlands', flag: '🇳🇱' },
  { name: 'Polski', flag: '🇵🇱' },
  { name: 'Română', flag: '🇷🇴' },
  { name: 'Čeština', flag: '🇨🇿' },
  { name: 'Svenska', flag: '🇸🇪' },
  { name: 'Dansk', flag: '🇩🇰' },
  { name: 'Norsk', flag: '🇳🇴' },
  { name: 'Suomi', flag: '🇫🇮' },
  { name: 'Magyar', flag: '🇭🇺' },
  { name: 'Ελληνικά', flag: '🇬🇷' },
  { name: 'Türkçe', flag: '🇹🇷' },
  { name: 'Русский', flag: '🇷🇺' },
  { name: 'Українська', flag: '🇺🇦' },
  { name: 'العربية', flag: '🇸🇦' },
  { name: 'עברית', flag: '🇮🇱' },
  { name: 'فارسی', flag: '🇮🇷' },
  { name: 'हिन्दी', flag: '🇮🇳' },
  { name: '中文', flag: '🇨🇳' },
  { name: '日本語', flag: '🇯🇵' },
  { name: '한국어', flag: '🇰🇷' },
  { name: 'Tiếng Việt', flag: '🇻🇳' },
  { name: 'ไทย', flag: '🇹🇭' },
  { name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { name: 'Tagalog', flag: '🇵🇭' },
];

export function SettingsPage() {
  const { languages } = useAppState();
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [newName, setNewName] = useState('');
  const [newFlag, setNewFlag] = useState('');

  const addedNames = new Set(languages.map((l) => l.name));

  const available = ALL_LANGUAGES.filter(
    (l) => !addedNames.has(l.name) && l.name.toLowerCase().includes(search.toLowerCase())
  );

  const handlePick = (lang: { name: string; flag: string }) => {
    dispatch({ type: 'ADD_LANGUAGE', payload: lang });
  };

  const handleAddCustom = () => {
    const name = newName.trim();
    const flag = newFlag.trim();
    if (!name || !flag) return;
    dispatch({ type: 'ADD_LANGUAGE', payload: { name, flag } });
    setNewName('');
    setNewFlag('');
    setShowCustom(false);
  };

  const handleRemove = (name: string) => {
    dispatch({ type: 'REMOVE_LANGUAGE', payload: { name } });
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Langues actives</h2>
      <div className={styles.list}>
        {languages.map((lang) => (
          <div key={lang.name} className={styles.item}>
            <span className={styles.flag}>{lang.flag}</span>
            <span className={styles.name}>{lang.name}</span>
            <button onClick={() => handleRemove(lang.name)} className={styles.removeBtn}>
              ✕
            </button>
          </div>
        ))}
      </div>

      <h2 className={styles.title}>Ajouter une langue</h2>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher..."
        className={styles.searchInput}
      />
      <div className={styles.picker}>
        {available.map((lang) => (
          <button
            key={lang.name}
            className={styles.pickBtn}
            onClick={() => handlePick(lang)}
            title={lang.name}
          >
            <span className={styles.pickFlag}>{lang.flag}</span>
            <span className={styles.pickName}>{lang.name}</span>
          </button>
        ))}
        {available.length === 0 && !showCustom && (
          <div className={styles.empty}>Aucun résultat</div>
        )}
      </div>

      {showCustom ? (
        <div className={styles.addForm}>
          <input
            type="text"
            value={newFlag}
            onChange={(e) => setNewFlag(e.target.value)}
            placeholder="🏳️"
            className={styles.flagInput}
            autoFocus
          />
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
            placeholder="Nom..."
            className={styles.nameInput}
          />
          <button onClick={handleAddCustom} className={styles.addBtn}>+</button>
          <button onClick={() => setShowCustom(false)} className={styles.cancelBtn}>✕</button>
        </div>
      ) : (
        <button className={styles.customLink} onClick={() => setShowCustom(true)}>
          + Langue personnalisée
        </button>
      )}
    </div>
  );
}
