import { useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { toast } from 'react-toastify';
import classnames from 'classnames';
import styles from './SendToken.module.scss';
import { SupportedBlockchains } from '../../utils/blockchain';
import { getBlockchainConfig, TokenConfig } from '../../utils/blockchainConfig';
import { BlockchainServiceFactory } from '../../services/BlockchainServiceFactory';

interface SendTokenProps {
  publicKey: PublicKey | string | null;
  blockchain: SupportedBlockchains;
}

export const SendToken = ({ publicKey, blockchain }: SendTokenProps) => {
  const [recipient, setRecipient] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [selectedToken, setSelectedToken] = useState<TokenConfig | null>(null);
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [gasFee, setGasFee] = useState<number>(0);
  const [transaction, setTransaction] = useState<any | null>(null);

  // Get the config for the selected blockchain
  const blockchainConfig = getBlockchainConfig(blockchain);

  const tokens = blockchainConfig.tokens;

  const handleSendClick = async () => {
    if (!recipient || !amount || !selectedToken) {
      setStatus('Please enter recipient, amount, and select a token.');
      return;
    }

    // Check if the recipient's address is valid for the current blockchain
    if (!blockchainConfig.isValidAddress(recipient)) {
      setStatus(`Invalid recipient address.`);
      return;
    }

    if (parseFloat(amount) <= 0) {
      setStatus('Amount must be greater than zero.');
      return;
    }

    try {
      setIsLoading(true);
      setStatus('Preparing transaction...');

      const blockchainService = BlockchainServiceFactory.getService(blockchain);

      const { transaction, fee } = await blockchainService.prepareTransaction(
        publicKey as PublicKey,
        recipient,
        parseFloat(amount),
        selectedToken.symbol,
      );

      // Open modal for confirmation
      setTransaction(transaction);
      setGasFee(fee);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error preparing transaction:', error);
      if (error instanceof Error) {
        setStatus(`Error preparing transaction: ${error.message}`);
        toast.error(`Transaction failed: ${error.message}`);
      } else {
        setStatus('Transaction failed: Unknown error');
        toast.error('Transaction failed: Unknown error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const confirmSendToken = async () => {
    if (!transaction) return;

    try {
      setIsLoading(true);
      setStatus('Sending transaction...');

      const blockchainService = BlockchainServiceFactory.getService(blockchain);
      await blockchainService.sendPreparedTransaction(transaction);

      setRecipient('');
      setAmount('');
      setStatus('Transaction successful!');
    } catch (error) {
      console.error('Error sending token:', error);
      if (error instanceof Error) {
        setStatus(`Transaction failed: ${error.message}`);
        toast.error(`Transaction failed: ${error.message}`);
      } else {
        setStatus('Transaction failed: Unknown error');
        toast.error('Transaction failed: Unknown error');
      }
    } finally {
      setIsLoading(false);
      setIsModalOpen(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTransaction(null);
    setGasFee(0);
    setStatus('');
  };

  return (
    <div className={styles.sendTokenContainer}>
      <h3>Send Tokens</h3>

      <input
        type="text"
        placeholder={`Recipient ${blockchainConfig.id} Address`}
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        className={styles.input}
      />

      <div className={styles.row}>
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={styles.input}
        />

        <select
          value={selectedToken?.symbol}
          onChange={(e) => setSelectedToken(tokens.find((token) => token.symbol === e.target.value) || null)}
          className={classnames(styles.input, styles.select)}
        >
          {tokens.map((token) => (
            <option key={token.symbol} value={token.symbol}>
              {token.name} ({token.symbol})
            </option>
          ))}
        </select>
      </div>

      <button onClick={handleSendClick} className={styles.sendButton} disabled={!publicKey || isLoading}>
        {isLoading ? 'Sending...' : 'Send'}
      </button>

      {status && <p className={styles.status}>{status}</p>}

      {isModalOpen && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h4>Confirm Transaction</h4>
            <p>
              You are about to send{' '}
              <strong>
                {amount} {selectedToken?.symbol}
              </strong>{' '}
              to <strong className={styles.recipient}>{recipient}</strong>.
            </p>
            <p>
              Gas Fee/Commission: <strong>{gasFee} SOL</strong>
            </p>
            <p>Are you sure you want to proceed?</p>
            <div className={styles.modalButtons}>
              <button onClick={confirmSendToken} className={styles.confirmButton}>
                Confirm
              </button>
              <button onClick={closeModal} className={styles.cancelButton}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
