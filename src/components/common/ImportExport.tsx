import { useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiDownload, FiUpload, FiSettings, FiArrowLeft } from "react-icons/fi";
import { useAppDispatch, useAppState } from "../../state/AppContext";
import { exportToJson, importFromJson } from "../../state/persistence";
import styles from "./ImportExport.module.css";

export function ImportExport() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const fileRef = useRef<HTMLInputElement>(null);
  const onSettings = location.pathname === "/settings";

  const handleToggleSettings = () => {
    navigate(onSettings ? "/guests" : "/settings");
  };

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
        <FiDownload aria-hidden /> Export
      </button>
      <button onClick={handleImport} className={styles.btn}>
        <FiUpload aria-hidden /> Import
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <button onClick={handleToggleSettings} className={styles.btn}>
        {onSettings ? (
          <>
            <FiArrowLeft aria-hidden /> Retour
          </>
        ) : (
          <>
            <FiSettings aria-hidden /> Paramètres
          </>
        )}
      </button>
    </div>
  );
}
