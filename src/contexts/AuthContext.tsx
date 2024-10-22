import { createContext, useState, useEffect, ReactNode, FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { WALLET_ADAPTERS } from '@web3auth/base';
import { web3AuthManager } from '../utils/web3auth';
import {
  clearMatrixAuthFromLocalStorage,
  getMatrixAuthFromLocalStorage,
  saveMatrixAuthToLocalStorage,
} from '../utils/utils';
import { matrixLoginWithPassword } from '../api/matrixApi';

interface AuthContextProps {
  matrixAccessToken: string | null;
  matrixUserId: string | null;
  loginWithPasswordMatrix: (username: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithPasswordless: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  setMatrixAccessToken: (token: string | null) => void;
  setMatrixUserId: (userId: string | null) => void;
}

export const AuthContext = createContext<AuthContextProps>({
  matrixAccessToken: null,
  matrixUserId: null,
  loginWithPasswordMatrix: async () => {},
  loginWithGoogle: async () => {},
  loginWithPasswordless: async () => {},
  logout: async () => {},
  setMatrixAccessToken: () => {},
  setMatrixUserId: () => {},
});

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [matrixAccessToken, setMatrixAccessToken] = useState<string | null>(null);
  const [matrixUserId, setMatrixUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedAuth = getMatrixAuthFromLocalStorage();
    if (storedAuth) {
      setMatrixAccessToken(storedAuth.matrixAccessToken);
      setMatrixUserId(storedAuth.matrixUserId);
    }
  }, []);

  const loginWithPasswordMatrix = async (username: string, password: string) => {
    try {
      const data = await matrixLoginWithPassword(username, password);
      setMatrixAccessToken(data.access_token);
      setMatrixUserId(data.user_id);
      saveMatrixAuthToLocalStorage(data.access_token, data.user_id);
      navigate('/');
    } catch (error) {
      console.error('Matrix login failed:', error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const web3auth = web3AuthManager.getWeb3Auth();
      if (!web3auth) throw new Error('Web3Auth not initialized');

      const provider = await web3auth.connectTo(WALLET_ADAPTERS.AUTH, {
        loginProvider: 'google',
      });

      console.log('Logged in with Google:', provider);
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  const loginWithPasswordless = async (email: string) => {
    try {
      const web3auth = web3AuthManager.getWeb3Auth();
      if (!web3auth) throw new Error('Web3Auth not initialized');

      const provider = await web3auth.connectTo(WALLET_ADAPTERS.AUTH, {
        loginProvider: 'email_passwordless',
        extraLoginOptions: {
          login_hint: email.trim(),
        },
      });

      console.log('Passwordless login successful:', provider);
    } catch (error) {
      console.error('Passwordless login error:', error);
    }
  };

  const logout = async () => {
    try {
      const web3auth = web3AuthManager.getWeb3Auth();
      if (web3auth) await web3auth.logout();

      setMatrixAccessToken(null);
      setMatrixUserId(null);
      clearMatrixAuthFromLocalStorage();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        matrixAccessToken,
        matrixUserId,
        loginWithPasswordMatrix,
        loginWithGoogle,
        loginWithPasswordless,
        logout,
        setMatrixAccessToken,
        setMatrixUserId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
