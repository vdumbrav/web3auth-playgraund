import styles from './Loading.module.scss';

interface LoadingProps {
  text?: string;
}

export const Loading = ({ text = 'Loading...' }: LoadingProps) => {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner}></div>
      <p>{text}</p>
    </div>
  );
};
