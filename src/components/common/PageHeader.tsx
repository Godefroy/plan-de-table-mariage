import { useNavigate } from "react-router-dom";
import styles from "./PageHeader.module.css";

interface PageHeaderProps {
  title: string;
  backTo?: string;
}

export function PageHeader({ title, backTo }: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={styles.header}>
      <button
        type="button"
        onClick={handleBack}
        className={styles.backBtn}
        aria-label="Retour"
      >
        <span aria-hidden="true">←</span> Retour
      </button>
      <h1 className={styles.title}>{title}</h1>
    </div>
  );
}
