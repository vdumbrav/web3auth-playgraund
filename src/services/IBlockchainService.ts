import { ParsedTransactionWithMeta, PublicKey, Transaction as TransactionSolana } from '@solana/web3.js';
import { Transaction as TransactionEthers } from 'ethers';
export interface IBlockchainService {
  /**
   * Retrieves the balance of a specific token for a given address.
   * @param address The wallet address.
   * @param tokenSymbol The symbol of the token (e.g., 'SOL', 'USDC').
   * @returns The balance of the token.
   */
  getBalance(address: PublicKey | string | null, tokenSymbol: string): Promise<number>;

  /**
   * Prepares a transaction for a specific token.
   * @param from The sender's address.
   * @param to The recipient's address.
   * @param amount The amount of the token to send.
   * @param tokenSymbol The symbol of the token (e.g., 'SOL', 'USDC').
   * @returns An object containing the prepared transaction and the estimated fee.
   */
  prepareTransaction(
    from: PublicKey | string,
    to: string,
    amount: number,
    tokenSymbol: string,
  ): Promise<{ transaction: TransactionSolana | TransactionEthers; fee: number }>;

  /**
   * Sends a previously prepared transaction.
   * @param transaction The transaction to send.
   * @returns The transaction hash/signature.
   */
  sendPreparedTransaction(transaction: TransactionSolana | TransactionEthers): Promise<string>;

  /**
   * Retrieves the transaction history for a specific token and address.
   * @param address The wallet address.
   * @returns An array of transactions.
   */

  getTransactionHistory(address: PublicKey | string): Promise<ParsedTransactionWithMeta[] | null>;

  /**
   * Retrieves the private key for the current wallet (optional, depending on the service).
   * @returns The private key as a string or null if not applicable.
   */
  getPrivateKey(): Promise<string | null>;

  /**
   * Retrieves the public key for the current wallet.
   * @returns The public key as a PublicKey object or string.
   */
  getPublicKey(): Promise<PublicKey | string | null>;
}
