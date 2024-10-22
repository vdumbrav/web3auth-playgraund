import { useContext } from 'react';
import styles from './LogoutButton.module.scss';
import { AuthContext } from '../../contexts/AuthContext';

export const LogoutButton = () => {
  const { logout } = useContext(AuthContext);

  return (
    <button onClick={logout} className={styles.logoutButton}>
      Logout
    </button>
  );
};
