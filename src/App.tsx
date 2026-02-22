import { useRef, useState } from 'react';
import { TabNav } from './components/common/TabNav';
import { ImportExport } from './components/common/ImportExport';
import { GuestList } from './components/guests/GuestList';
import { AffinityMatrix } from './components/affinities/AffinityMatrix';
import { CoupleList } from './components/couples/CoupleList';
import { TableList } from './components/tables/TableList';
import { SeatingPlan } from './components/seating/SeatingPlan';
import { SettingsPage } from './components/settings/SettingsPage';
import styles from './App.module.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('guests');
  const prevTabRef = useRef('guests');

  const handleOpenSettings = () => {
    if (activeTab === 'settings') {
      setActiveTab(prevTabRef.current);
    } else {
      prevTabRef.current = activeTab;
      setActiveTab('settings');
    }
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>Plan de Table</h1>
        <ImportExport onOpenSettings={handleOpenSettings} />
      </header>
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
      <main className={styles.main}>
        {activeTab === 'guests' && <GuestList />}
        {activeTab === 'affinities' && <AffinityMatrix />}
        {activeTab === 'couples' && <CoupleList />}
        {activeTab === 'tables' && <TableList />}
        {activeTab === 'seating' && <SeatingPlan />}
        {activeTab === 'settings' && <SettingsPage />}
      </main>
    </div>
  );
}
