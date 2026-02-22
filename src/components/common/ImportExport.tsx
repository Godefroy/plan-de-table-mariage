import { useRef } from "react";
import { useAppDispatch, useAppState } from "../../state/AppContext";
import { exportToJson, importFromJson } from "../../state/persistence";
import styles from "./ImportExport.module.css";

export function ImportExport({
  onOpenSettings,
}: {
  onOpenSettings: () => void;
}) {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    exportToJson(state);
  };

  const handleImport = () => {
    fileRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const imported = importFromJson(text);
      if (imported) {
        dispatch({ type: "IMPORT_STATE", payload: imported });
      } else {
        alert("Fichier JSON invalide.");
      }
    };
    reader.readAsText(file);

    // Reset input
    e.target.value = "";
  };

  return (
    <div className={styles.bar}>
      <button onClick={handleExport} className={styles.btn}>
        Exporter JSON
      </button>
      <button onClick={handleImport} className={styles.btn}>
        Importer JSON
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <button onClick={onOpenSettings} className={styles.btn}>
        Paramètres
      </button>
    </div>
  );
}
