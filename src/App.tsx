import { useEffect, useState } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import styles from './App.module.scss';
import { ToastContainer } from 'react-toastify';
import { initWeb3Auth } from './utils/web3auth';
import { WalletContent } from './components/WalletContent';
import { ADAPTER_STATUS, ADAPTER_STATUS_TYPE } from '@web3auth/base';
import { Login, LogoutButton } from './components';
import 'react-toastify/dist/ReactToastify.css';
import { SupportedBlockchains } from './utils/blockchain';
import { OAuthCallback } from './components/OAuthCallback';
import { Loading } from './components/Loading/Loading';

const App = () => {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [web3AuthInstance, setWeb3AuthInstance] = useState<ADAPTER_STATUS_TYPE | undefined>(undefined);
  const [selectedBlockchain, setSelectedBlockchain] = useState<SupportedBlockchains>(SupportedBlockchains.SOLANA);

  useEffect(() => {
    const initializeWeb3Auth = async () => {
      setWeb3AuthInstance(undefined);
      try {
        const instance = await initWeb3Auth(selectedBlockchain);
        if (instance) {
          setWeb3AuthInstance(instance.status);
          console.log('Web3Auth initialized:', instance);
        } else {
          console.error('Web3Auth instance is null');
        }
      } catch (error) {
        console.error('Failed to initialize Web3Auth:', error);
      }
    };

    initializeWeb3Auth();
  }, [selectedBlockchain]);

  if (!web3AuthInstance) {
    return <Loading text="Initializing Web3Auth...." />;
  }

  return (
    <div className={styles.appContainer}>
      <ToastContainer />
      <Routes>
        <Route
          path="/login"
          element={web3AuthInstance === ADAPTER_STATUS.CONNECTED ? <Navigate to="/" /> : <Login />}
        />
        <Route path="/callback" element={<OAuthCallback />} />
        <Route
          path="/"
          element={
            web3AuthInstance === ADAPTER_STATUS.CONNECTED ? (
              <div className={styles.content}>
                <h1>Web3 Authenticated Wallet</h1>
                <>
                  <WalletContent selectedBlockchain={selectedBlockchain} />
                  <LogoutButton />
                </>
              </div>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </div>
  );
};

export default App;
