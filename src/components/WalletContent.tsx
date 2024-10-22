import { useEffect, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { Wallet } from './Wallet/Wallet';
import { SendToken } from './SendToken/SendToken';
import { Loading } from './Loading/Loading';
import stylesWallet from './Wallet/Wallet.module.scss';
import { initWeb3Auth } from '../utils/web3auth';
import { SupportedBlockchains } from '../utils/blockchain';
import { TransactionHistory } from './TransactionHistory/TransactionHistory';
import { BlockchainServiceFactory } from '../services/BlockchainServiceFactory';
import { IBlockchainService } from '../services/IBlockchainService';

interface WalletContentProps {
  selectedBlockchain: SupportedBlockchains;
  onBlockchainChange?: (blockchain: SupportedBlockchains) => void;
}

export const WalletContent = ({ selectedBlockchain, onBlockchainChange }: WalletContentProps) => {
  const [publicKey, setPublicKey] = useState<string | PublicKey | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const blockchainService: IBlockchainService = BlockchainServiceFactory.getService(selectedBlockchain);

  useEffect(() => {
    const fetchPublicKey = async () => {
      try {
        setIsLoading(true);
        await initWeb3Auth(selectedBlockchain);
        const publicKey = await blockchainService.getPublicKey();
        setPublicKey(publicKey);
        setIsLoading(false);
      } catch (error) {
        console.error(`Error fetching public key for ${selectedBlockchain}:`, error);
        setIsLoading(false);
      }
    };

    fetchPublicKey();
  }, [selectedBlockchain]);

  const handleBlockchainSwitch = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onBlockchainChange(event.target.value as SupportedBlockchains);
    setPublicKey(null);
  };

  if (isLoading) {
    return <Loading text="Fetching wallet details..." />;
  }

  return (
    <>
      <div className={stylesWallet.switchContainer}>
        <select value={selectedBlockchain} onChange={handleBlockchainSwitch}>
          <option value={SupportedBlockchains.SOLANA}>Solana Devnet</option>
          <option value={SupportedBlockchains.POLYGON}>Polygon Amoy Testnet</option>
        </select>
      </div>
      {publicKey ? (
        <>
          <div className={stylesWallet.walletColumns}>
            <SendToken publicKey={publicKey} blockchain={selectedBlockchain} />
            <Wallet publicKey={publicKey} blockchain={selectedBlockchain} />
          </div>
          <div className={stylesWallet.walletColumns}>
            <TransactionHistory publicKey={publicKey} blockchain={selectedBlockchain} />
          </div>
        </>
      ) : (
        <div>No public key available for {selectedBlockchain}</div>
      )}
    </>
  );
};
