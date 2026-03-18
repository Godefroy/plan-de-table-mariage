import { useRef, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { TabNav } from "./components/common/TabNav";
import { ImportExport } from "./components/common/ImportExport";
import { GuestList } from "./components/guests/GuestList";
import { AffinityMatrix } from "./components/affinities/AffinityMatrix";
import { TableList } from "./components/tables/TableList";
import { SeatingPlan } from "./components/seating/SeatingPlan";
import { SettingsPage } from "./components/settings/SettingsPage";
import { useAppState } from "./state/AppContext";
import styles from "./App.module.css";

function WelcomePage() {
 return (
  <div className={styles.welcome}>
   <div className={styles.intro}>
    <p className={styles.introTitle}>
     Bienvenue dans votre assistant de plan de table !
    </p>
    <p className={styles.introText}>
     Organiser un plan de table, c'est un casse-tête, mais on va le résoudre
     ensemble. Commencez par ajouter vos <strong>invités</strong> et leurs
     conjoints, puis indiquez les <strong>affinités</strong> entre eux (qui
     s'entend bien, qui risque de ne pas s'apprécier…). Configurez vos{" "}
     <strong>tables</strong>, et laissez l'outil vous proposer un placement où
     tout le monde passe une super soirée. Vos données sont sauvegardées
     automatiquement dans votre navigateur, et vous pouvez exporter/importer
     votre plan pour le partager ou le retrouver sur un autre appareil.
    </p>
   </div>
   <a href="/guests" className={styles.startButton}>
    Commencer
   </a>
  </div>
 );
}

export default function App() {
 const state = useAppState();
 const hasData = state.guests.length > 0;

 const [showSettings, setShowSettings] = useState(false);
 const prevPathRef = useRef("/guests");

 const handleOpenSettings = () => {
  setShowSettings((prev) => !prev);
 };

 if (!hasData) {
  return (
   <div className={styles.app}>
    <header className={styles.headerCentered}>
     <h1 className={styles.title}>Le Plan de Table idéal pour votre Mariage</h1>
    </header>
    <Routes>
     <Route path="/guests" element={<GuestList />} />
     <Route path="*" element={<WelcomePage />} />
    </Routes>
   </div>
  );
 }

 return (
  <div className={styles.app}>
   <header className={styles.header}>
    <h1 className={styles.title}>Le Plan de Table idéal pour votre Mariage</h1>
    <ImportExport onOpenSettings={handleOpenSettings} />
   </header>
   {showSettings ? (
    <main className={styles.main}>
     <SettingsPage />
    </main>
   ) : (
    <>
     <TabNav />
     <main className={styles.main}>
      <Routes>
       <Route path="/guests" element={<GuestList />} />
       <Route path="/affinities" element={<AffinityMatrix />} />
       <Route path="/tables" element={<TableList />} />
       <Route path="/seating" element={<SeatingPlan />} />
       <Route path="*" element={<Navigate to="/guests" replace />} />
      </Routes>
     </main>
    </>
   )}
  </div>
 );
}
