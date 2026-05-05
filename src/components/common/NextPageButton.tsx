import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import styles from './NextPageButton.module.css';

interface Props {
  to: string;
  label: string;
}

export function NextPageButton({ to, label }: Props) {
  return (
    <div className={styles.wrapper}>
      <Link to={to} className={styles.btn}>
        Suivant : {label} <FiArrowRight aria-hidden />
      </Link>
    </div>
  );
}
