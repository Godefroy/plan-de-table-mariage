import { useState } from 'react';
import { TabNav } from './components/common/TabNav';
import { ImportExport } from './components/common/ImportExport';
import { GuestList } from './components/guests/GuestList';
import { AffinityMatrix } from './components/affinities/AffinityMatrix';
import { CoupleList } from './components/couples/CoupleList';
import { TableList } from './components/tables/TableList';
import { SeatingPlan } from './components/seating/SeatingPlan';
import styles from './App.module.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('guests');

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>Plan de Table</h1>
        <ImportExport />
      </header>
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
      <main className={styles.main}>
        {activeTab === 'guests' && <GuestList />}
        {activeTab === 'affinities' && <AffinityMatrix />}
        {activeTab === 'couples' && <CoupleList />}
        {activeTab === 'tables' && <TableList />}
        {activeTab === 'seating' && <SeatingPlan />}
      </main>
    </div>
  );
}
