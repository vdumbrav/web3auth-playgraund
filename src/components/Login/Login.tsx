import { useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import { AuthContext } from '../../contexts/AuthContext';
import styles from './Login.module.scss';
import classnames from 'classnames';

interface FormValues {
  username: string;
  password: string;
  email: string;
}

export const Login = () => {
  const { loginWithPasswordMatrix, loginWithGoogle, loginWithPasswordless } = useContext(AuthContext);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onPasswordSubmit = async (data: FormValues) => {
    if (!data.username || !data.password) {
      setErrorMessage('Please enter both username and password.');
      return;
    }
    try {
      setErrorMessage(null);
      await loginWithPasswordMatrix(data.username, data.password);
    } catch (_) {
      setErrorMessage('Login failed. Please check your username and password.');
    }
  };

  const onPasswordlessSubmit = async (data: FormValues) => {
    if (!data.email) {
      setErrorMessage('Please enter your email.');
      return;
    }
    try {
      setErrorMessage(null);
      await loginWithPasswordless(data.email);
    } catch (_) {
      setErrorMessage('Passwordless login failed.');
    }
  };

  return (
    <div className={styles.loginContainer}>
      <h2>Login</h2>

      <form className={styles.form}>
        <h3>Login with Username and Password in Matrix</h3>
        <input
          type="text"
          placeholder="Enter your Matrix username"
          disabled={isSubmitting}
          {...register('username', { required: 'Username is required' })}
          className={classnames(styles.input)}
        />
        {errors.username && <span className={styles.errorMessage}>{errors.username.message}</span>}

        <input
          type="password"
          placeholder="Enter your password"
          disabled={isSubmitting}
          {...register('password')}
          className={classnames(styles.input, { [styles.errorInput]: errors.password })}
        />
        {errors.password && <span className={styles.errorMessage}>{errors.password.message}</span>}

        {errorMessage && <span className={styles.errorMessage}>{errorMessage}</span>}

        <button
          type="button"
          onClick={handleSubmit(onPasswordSubmit)}
          className={styles.buttonSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Logging in...' : 'Login with Password'}
        </button>
      </form>

      <div className={styles.divider}>OR</div>

      <form className={styles.form}>
        <h3>Login with Email (Passwordless)</h3>
        <input
          type="email"
          placeholder="Enter your email"
          disabled={isSubmitting}
          {...register('email')}
          className={classnames(styles.input, { [styles.errorInput]: errors.email })}
        />
        {errors.email && <span className={styles.errorMessage}>{errors.email.message}</span>}

        <button
          type="button"
          onClick={handleSubmit(onPasswordlessSubmit)}
          className={styles.buttonSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Logging in...' : 'Login with Email'}
        </button>
      </form>

      <div className={styles.divider}>OR</div>

      <button onClick={loginWithGoogle} className={classnames(styles.googleButton, styles.buttonSubmit)}>
        Login with Google
      </button>
    </div>
  );
};
