import { Connection, PublicKey, Transaction, SystemProgram, Signer, ParsedTransactionWithMeta } from '@solana/web3.js';
import {
  getAccount,
  getAssociatedTokenAddress,
  createTransferCheckedInstruction,
  getOrCreateAssociatedTokenAccount,
} from '@solana/spl-token';
import { SolanaWallet } from '@web3auth/solana-provider';
import { toast } from 'react-toastify';
import { getBlockchainConfig } from '../utils/blockchainConfig';
import { SupportedBlockchains } from '../utils/blockchain';
import { getSolanaWallet } from '../utils/web3auth';
import { IBlockchainService } from './IBlockchainService';

export class SolanaService implements IBlockchainService {
  private connection: Connection;
  private blockchain: SupportedBlockchains;

  constructor() {
    this.blockchain = SupportedBlockchains.SOLANA;
    const config = getBlockchainConfig(this.blockchain);
    this.connection = new Connection(config.rpcUrl, 'confirmed');
  }

  async getPublicKey(): Promise<PublicKey | null> {
    const solanaWallet = getSolanaWallet();
    if (!solanaWallet) {
      console.warn('No solana wallet found');
      return null;
    }

    const accounts = await solanaWallet?.requestAccounts();

    if (accounts?.length) {
      return new PublicKey(accounts[0]);
    }
    return null;
  }

  /**
   * Retrieves the balance of the specified token for a given address.
   */
  async getBalance(address: PublicKey | string, tokenSymbol: string): Promise<number> {
    try {
      const config = getBlockchainConfig(this.blockchain);
      const token = config.tokens.find((t) => t.symbol === tokenSymbol);
      if (!token) throw new Error(`Token ${tokenSymbol} not supported on ${this.blockchain}`);

      if (token.symbol === 'SOL') {
        const publicKey = new PublicKey(address);
        const balanceLamports = await this.connection.getBalance(publicKey);
        return balanceLamports / Math.pow(10, token.decimals);
      } else {
        const signer = await getSigner();
        console.log(signer);
        const tokenAccount = await getOrCreateAssociatedTokenAccount(
          this.connection,
          signer,
          new PublicKey(token.address),
          address,
        );

        const accountInfo = await getAccount(this.connection, tokenAccount.address);
        const usdcBalance = Number(accountInfo.amount) / 1e6;
        return usdcBalance;
      }
    } catch (error) {
      console.error(`Error fetching balance for ${tokenSymbol} on Solana:`, error);
      toast.error(`Failed to retrieve balance for ${tokenSymbol}`);
      return 0;
    }
  }

  /**
   * Prepares the transaction and calculates gas/fee for SOL and SPL tokens
   */
  async prepareTransaction(
    from: PublicKey | string,
    to: PublicKey | string,
    amount: number,
    tokenSymbol: string,
  ): Promise<{
    transaction: Transaction;
    fee: number;
  }> {
    try {
      const fromPublicKey = new PublicKey(from);
      const toPublicKey = new PublicKey(to);
      const config = getBlockchainConfig(this.blockchain);
      const token = config.tokens.find((t) => t.symbol === tokenSymbol);

      if (!token) {
        throw new Error(`Token ${tokenSymbol} not supported on Solana`);
      }

      let transaction: Transaction;

      if (tokenSymbol === 'SOL') {
        // For SOL transfers
        transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: fromPublicKey,
            toPubkey: toPublicKey,
            lamports: amount * Math.pow(10, token.decimals), // Convert SOL to lamports
          }),
        );
      } else {
        // For SPL tokens (e.g., USDC)
        const tokenMintAddress = new PublicKey(token.address);
        const fromTokenAccount = await getAssociatedTokenAddress(tokenMintAddress, fromPublicKey);
        const signer = await getSigner();
        const toTokenAccount = await getOrCreateAssociatedTokenAccount(
          this.connection,
          signer,
          tokenMintAddress,
          toPublicKey,
        );

        transaction = new Transaction().add(
          createTransferCheckedInstruction(
            fromTokenAccount,
            tokenMintAddress,
            toTokenAccount.address,
            fromPublicKey,
            amount * Math.pow(10, token.decimals), // Convert token amount considering decimals
            token.decimals,
          ),
        );
      }

      const latestBlockhash = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = fromPublicKey;

      // Compile the transaction message to estimate fee
      const message = transaction.compileMessage();
      const { value: fee } = await this.connection.getFeeForMessage(message);

      if (fee === null) {
        throw new Error('Failed to retrieve transaction fee.');
      }

      return {
        transaction,
        fee: fee / Math.pow(10, 9), // Convert fee to SOL
      };
    } catch (error) {
      console.error('Error preparing transaction:', error);
      throw error;
    }
  }

  /**
   * Sends the already prepared transaction
   */
  async sendPreparedTransaction(transaction: Transaction): Promise<string> {
    try {
      const wallet = getSolanaWallet();
      if (!wallet) {
        throw new Error('Solana wallet not initialized');
      }

      const signedTransaction = await wallet.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(signedTransaction.serialize(), {
        preflightCommitment: 'confirmed',
      });

      const confirmation = await this.connection.confirmTransaction({
        signature,
        blockhash: transaction.recentBlockhash!,
        lastValidBlockHeight: (await this.connection.getLatestBlockhash()).lastValidBlockHeight,
      });

      if (confirmation.value.err) {
        throw new Error('Transaction failed during confirmation.');
      }

      toast.success(`Transaction successful! Signature: ${signature}`);
      return signature;
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    }
  }

  /**
   * Retrieves the transaction history for the specified address and token.
   */
  async getTransactionHistory(address: PublicKey | string): Promise<ParsedTransactionWithMeta[] | null> {
    try {
      const publicKey = new PublicKey(address);
      const signatures = await this.connection.getSignaturesForAddress(publicKey);
      const parsedTransactions = await Promise.all(
        signatures.map(async (sig) => {
          return await this.connection.getParsedTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0,
          });
        }),
      );
      return parsedTransactions.filter((tx) => tx !== null);
    } catch (error) {
      console.error(`Error fetching transaction history on Solana:`, error);
      toast.error(`Failed to retrieve transaction history`);
      return null;
    }
  }

  async getPrivateKey(): Promise<string | null> {
    const wallet = getSolanaWallet();

    if (!wallet) {
      throw new Error('Solana wallet not initialized');
    }
    const privateKey = await wallet.provider.request({
      method: 'private_key',
    });

    if (typeof privateKey === 'string') {
      return privateKey;
    }

    return null;
  }
}

async function getSigner(): Promise<Signer> {
  try {
    const solanaWallet = getSolanaWallet(); // Ваш метод для получения Web3Auth
    const provider = solanaWallet.provider;

    if (!provider) {
      throw new Error('Solana wallet provider not initialized');
    }

    const wallet = new SolanaWallet(provider);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return wallet; // Это объект, который можно использовать для подписания транзакций
  } catch (error) {
    console.error('Error fetching Signer from Web3Auth:', error);
    throw error;
  }
}
