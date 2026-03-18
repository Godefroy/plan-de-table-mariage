import { NavLink } from 'react-router-dom';
import styles from './TabNav.module.css';

interface Tab {
  path: string;
  label: string;
}

const TABS: Tab[] = [
  { path: '/guests', label: 'Invités' },
  { path: '/affinities', label: 'Affinités' },
  { path: '/tables', label: 'Tables' },
  { path: '/seating', label: 'Plan de table' },
];

export function TabNav() {
  return (
    <nav className={styles.nav}>
      {TABS.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.active : ''}`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
