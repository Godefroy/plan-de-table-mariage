import { useState } from 'react';
import type { Guest, LanguageLevel, LanguageSkill } from '../../types';
import { useAppDispatch } from '../../state/AppContext';
import styles from './LanguageEditor.module.css';

const LEVELS: { value: LanguageLevel; label: string }[] = [
  { value: 'native', label: 'Natif' },
  { value: 'fluent', label: 'Courant' },
  { value: 'intermediate', label: 'Intermédiaire' },
  { value: 'basic', label: 'Basique' },
];

const COMMON_LANGUAGES = [
  'Français', 'English', 'Español', 'Deutsch', 'Italiano',
  'Português', 'العربية', '中文', '日本語', 'Русский',
];

export function LanguageEditor({ guest }: { guest: Guest }) {
  const dispatch = useAppDispatch();
  const [newLang, setNewLang] = useState('');
  const [newLevel, setNewLevel] = useState<LanguageLevel>('fluent');

  const updateLanguages = (languages: LanguageSkill[]) => {
    dispatch({
      type: 'SET_GUEST_LANGUAGES',
      payload: { id: guest.id, languages },
    });
  };

  const handleAdd = () => {
    const lang = newLang.trim();
    if (!lang) return;
    if (guest.languages.some((l) => l.language.toLowerCase() === lang.toLowerCase())) return;
    updateLanguages([...guest.languages, { language: lang, level: newLevel }]);
    setNewLang('');
  };

  const handleRemove = (language: string) => {
    updateLanguages(guest.languages.filter((l) => l.language !== language));
  };

  const handleLevelChange = (language: string, level: LanguageLevel) => {
    updateLanguages(
      guest.languages.map((l) =>
        l.language === language ? { ...l, level } : l
      )
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.langList}>
        {guest.languages.map((l) => (
          <div key={l.language} className={styles.langItem}>
            <span className={styles.langName}>{l.language}</span>
            <select
              value={l.level}
              onChange={(e) => handleLevelChange(l.language, e.target.value as LanguageLevel)}
              className={styles.levelSelect}
            >
              {LEVELS.map((lv) => (
                <option key={lv.value} value={lv.value}>
                  {lv.label}
                </option>
              ))}
            </select>
            <button onClick={() => handleRemove(l.language)} className={styles.removeBtn}>
              ✕
            </button>
          </div>
        ))}
      </div>
      <div className={styles.addForm}>
        <input
          type="text"
          list="common-languages"
          value={newLang}
          onChange={(e) => setNewLang(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Langue..."
          className={styles.langInput}
        />
        <datalist id="common-languages">
          {COMMON_LANGUAGES.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>
        <select
          value={newLevel}
          onChange={(e) => setNewLevel(e.target.value as LanguageLevel)}
          className={styles.levelSelect}
        >
          {LEVELS.map((lv) => (
            <option key={lv.value} value={lv.value}>
              {lv.label}
            </option>
          ))}
        </select>
        <button onClick={handleAdd} className={styles.addBtn}>
          +
        </button>
      </div>
    </div>
  );
}
