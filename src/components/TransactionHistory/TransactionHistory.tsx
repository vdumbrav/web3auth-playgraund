import { useEffect, useState } from 'react';
import styles from './TransactionHistory.module.scss';
import { BlockchainServiceFactory } from '../../services/BlockchainServiceFactory';
import { IBlockchainService } from '../../services/IBlockchainService';
import { SupportedBlockchains } from '../../utils/blockchain';
import { ParsedTransactionWithMeta, PublicKey } from '@solana/web3.js';
import { formatTimestamp } from '../../utils/utils';

interface TransactionHistoryProps {
  publicKey: PublicKey | string;
  blockchain: SupportedBlockchains;
}

export const TransactionHistory = ({ publicKey, blockchain }: TransactionHistoryProps) => {
  const [transactions, setTransactions] = useState<ParsedTransactionWithMeta[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const blockchainService: IBlockchainService = BlockchainServiceFactory.getService(blockchain);

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        const history = await blockchainService.getTransactionHistory(publicKey);
        setTransactions(history);
      } catch (error) {
        console.error(`Error fetching transaction history for ${blockchain}:`, error);
        setTransactions(null);
      }
      setIsLoading(false);
    };

    fetchTransactions();
  }, [publicKey, blockchain]);

  return (
    <div className={styles.transactionHistoryContainer}>
      <h3>Transaction History</h3>

      {!publicKey ? (
        <p>No wallet connected.</p>
      ) : isLoading ? (
        <p>Loading transactions...</p>
      ) : transactions?.length === 0 ? (
        <p>No transactions found.</p>
      ) : (
        <ul className={styles.transactionList}>
          {transactions?.map((tx, index) => (
            <li key={index} className={styles.transactionItem}>
              <p>
                <strong>Signature:</strong>{' '}
                <a
                  href={`https://explorer.solana.com/tx/${tx.transaction.signatures[0]}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {tx.transaction.signatures[0]}
                </a>
              </p>
              <p>
                <strong>Block Time:</strong> {tx.blockTime ? formatTimestamp(tx.blockTime * 1000, true) : 'N/A'}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
