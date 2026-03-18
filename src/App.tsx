import { useRef, useState } from "react";
import { TabNav } from "./components/common/TabNav";
import { ImportExport } from "./components/common/ImportExport";
import { GuestList } from "./components/guests/GuestList";
import { AffinityMatrix } from "./components/affinities/AffinityMatrix";
import { TableList } from "./components/tables/TableList";
import { SeatingPlan } from "./components/seating/SeatingPlan";
import { SettingsPage } from "./components/settings/SettingsPage";
import styles from "./App.module.css";

export default function App() {
 const [activeTab, setActiveTab] = useState("guests");
 const prevTabRef = useRef("guests");

 const handleOpenSettings = () => {
  if (activeTab === "settings") {
   setActiveTab(prevTabRef.current);
  } else {
   prevTabRef.current = activeTab;
   setActiveTab("settings");
  }
 };

 return (
  <div className={styles.app}>
   <header className={styles.header}>
    <h1 className={styles.title}>Le Plan de Table idéal pour votre Mariage</h1>
    <ImportExport onOpenSettings={handleOpenSettings} />
   </header>
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
   <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
   <main className={styles.main}>
    {activeTab === "guests" && <GuestList />}
    {activeTab === "affinities" && <AffinityMatrix />}
    {activeTab === "tables" && <TableList />}
    {activeTab === "seating" && <SeatingPlan />}
    {activeTab === "settings" && <SettingsPage />}
   </main>
  </div>
 );
}
