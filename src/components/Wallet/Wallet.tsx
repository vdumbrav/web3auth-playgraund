import { useEffect, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { toast } from 'react-toastify';
import classnames from 'classnames';
import styles from './Wallet.module.scss';
import { SupportedBlockchains } from '../../utils/blockchain';
import { getBlockchainConfig } from '../../utils/blockchainConfig';
import { BlockchainServiceFactory } from '../../services/BlockchainServiceFactory';

interface WalletProps {
  publicKey: PublicKey | string | null;
  blockchain: SupportedBlockchains;
}

export const Wallet = ({ publicKey, blockchain }: WalletProps) => {
  const [balances, setBalances] = useState<Record<string, number | null>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const blockchainConfig = getBlockchainConfig(blockchain);

  const fetchBalances = async () => {
    setIsLoading(true);
    const newBalances: Record<string, number | null> = {};
    const blockchainService = BlockchainServiceFactory.getService(blockchain);

    for (const token of blockchainConfig.tokens) {
      try {
        const balance = await blockchainService.getBalance(publicKey, token.symbol);
        newBalances[token.symbol] = balance;
      } catch (error) {
        console.error(`Error fetching balance for ${token.symbol}:`, error);
        newBalances[token.symbol] = null;
      }
    }

    setBalances(newBalances);
    setIsLoading(false);
  };

  const getPrivateKey = async () => {
    const blockchainService = BlockchainServiceFactory.getService(blockchain);
    const privateKey = await blockchainService.getPrivateKey();
    setPrivateKey(privateKey);
  };

  useEffect(() => {
    if (publicKey) {
      fetchBalances();
    } else {
      toast.warning('No public key or provider available. Please connect your wallet.');
    }
  }, [publicKey, blockchain, blockchainConfig]);

  return (
    <div className={styles.walletContainer}>
      <h3>Wallet</h3>
      {publicKey ? (
        <>
          <div className={styles.data}>
            <p>
              <strong>Public Key:</strong> {typeof publicKey === 'string' ? publicKey : publicKey.toBase58()}
            </p>
            <strong>Balance:</strong>
            {blockchainConfig.tokens.map((token) => (
              <div key={token.symbol}>
                <p>
                  {token.symbol}: {balances[token.symbol] ?? 'Loading...'}
                </p>
              </div>
            ))}
            {privateKey && (
              <p>
                <strong>Private Key:</strong> {privateKey}
              </p>
            )}
          </div>
          <div className={styles.walletButtons}>
            <button className={styles.walletButton} onClick={fetchBalances} disabled={isLoading}>
              {isLoading ? 'Fetching...' : 'Refresh Balance'}
            </button>
            <button
              className={classnames(styles.walletButton, styles.revealButton)}
              onClick={getPrivateKey}
              type={'button'}
            >
              Get Private Key
            </button>
          </div>
        </>
      ) : (
        <p>No wallet connected.</p>
      )}
    </div>
  );
};
