import styles from './TabNav.module.css';

interface Tab {
  id: string;
  label: string;
}

const TABS: Tab[] = [
  { id: 'guests', label: 'Invités' },
  { id: 'affinities', label: 'Affinités' },
  { id: 'couples', label: 'Couples' },
  { id: 'tables', label: 'Tables' },
  { id: 'seating', label: 'Plan de table' },
];

export function TabNav({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  return (
    <nav className={styles.nav}>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
