import { ethers, Contract } from 'ethers';
import { toast } from 'react-toastify';
import { IBlockchainService } from './IBlockchainService';
import { getBlockchainConfig } from '../utils/blockchainConfig';
import { SupportedBlockchains } from '../utils/blockchain';
import { getPolygonProvider, web3AuthManager } from '../utils/web3auth';
import ERC20_ABI from '../abis/ERC20.json'; // ABI for ERC20 tokens

export class PolygonService implements IBlockchainService {
  private provider: ethers.BrowserProvider;
  private blockchain: SupportedBlockchains;

  constructor(provider: ethers.BrowserProvider) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      throw new Error('Ethereum provider not found. Please install MetaMask or another wallet.');
    }
    this.blockchain = SupportedBlockchains.POLYGON;
    this.provider = provider;
  }

  async getPolygonPublicKey(): Promise<string | null> {
    const polygonProvider = getPolygonProvider();
    if (!polygonProvider) {
      console.warn('No polygon provider found');
      return null;
    }

    const signer = await polygonProvider?.getSigner();
    const polygonAddress = await signer?.getAddress();

    if (polygonAddress) {
      return polygonAddress;
    }

    return null;
  }

  /**
   * Retrieves the balance of the specified token for a given address.
   */
  async getBalance(address: string, tokenSymbol: string): Promise<number> {
    try {
      const config = getBlockchainConfig(this.blockchain);
      const token = config.tokens.find((t) => t.symbol === tokenSymbol);
      if (!token) throw new Error(`Token ${tokenSymbol} not supported on ${this.blockchain}`);

      if (token.symbol === 'POL') {
        // For native POL token
        const balance = await this.provider.getBalance(address);
        return parseFloat(ethers.formatEther(balance));
      } else {
        // For ERC20 tokens like USDC, USDT
        const contract = new Contract(token.address, ERC20_ABI, this.provider);
        const balanceRaw = await contract.balanceOf(address);
        return parseFloat(ethers.formatUnits(balanceRaw, token.decimals));
      }
    } catch (error) {
      console.error(`Error fetching balance for ${tokenSymbol} on Polygon:`, error);
      toast.error(`Failed to fetch balance for ${tokenSymbol}`);
      return 0;
    }
  }

  /**
   * Sends a transaction for the specified token.
   */
  async sendTransaction(from: string, to: string, amount: number, tokenSymbol: string): Promise<string> {
    try {
      console.log('Sending transaction:', from);
      const config = getBlockchainConfig(this.blockchain);
      const token = config.tokens.find((t) => t.symbol === tokenSymbol);
      if (!token) throw new Error(`Token ${tokenSymbol} not supported on ${this.blockchain}`);

      const signer = await this.provider.getSigner();
      const amountString = amount.toFixed(token.decimals);
      const amountInWei = ethers.parseUnits('0.39', 18);
      console.log('amountInWei:', amountInWei);
      if (token.symbol === 'POL') {
        // Sending native POL token
        const tx = await signer.sendTransaction({
          to,
          value: ethers.parseUnits(amountString, 18), // POL has 18 decimals
        });
        await tx.wait();
        return tx.hash;
      } else {
        // Sending ERC20 token
        const contract = new Contract(token.address, ERC20_ABI, signer);
        const tx = await contract.transfer(to, ethers.parseUnits(amount.toString(), token.decimals));
        await tx.wait();
        return tx.hash;
      }
    } catch (error) {
      console.error(`Error sending ${tokenSymbol} on Polygon:`, error);
      toast.error(`Failed to send ${tokenSymbol}`);
      throw error;
    }
  }

  /**
   * Retrieves the transaction history for the specified address and token.
   */
  async getTransactionHistory(address: string, tokenSymbol: string): Promise<any[]> {
    try {
      const config = getBlockchainConfig(this.blockchain);
      const token = config.tokens.find((t) => t.symbol === tokenSymbol);
      if (!token) throw new Error(`Token ${tokenSymbol} not supported on ${this.blockchain}`);

      if (token.symbol === 'POL') {
        // Using Polygonscan API to fetch transaction history for native POL token
        const apiKey = process.env.REACT_APP_POLYGONSCAN_API_KEY;
        const response = await fetch(
          `https://api.polygonscan.com/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${apiKey}`,
        );
        const data = await response.json();
        if (data.status !== '1') throw new Error('Failed to fetch transaction history');
        return data.result;
      } else {
        // For ERC20 tokens, fetching transaction history will require additional API integrations
        // For now, this is a placeholder
        toast.info(`Fetching transaction history for ERC20 tokens (${tokenSymbol}) on Polygon is not yet implemented.`);
        return [];
      }
    } catch (error) {
      console.error(`Error fetching transaction history for ${tokenSymbol} on Polygon:`, error);
      toast.error(`Failed to fetch transaction history for ${tokenSymbol}`);
      return [];
    }
  }

  async getPrivateKey(): Promise<string | null> {
    const provider = web3AuthManager.getProvider();

    const privateKey = await provider?.request({
      method: 'eth_private_key',
    });

    if (typeof privateKey === 'string') {
      return privateKey;
    }

    return null;
  }
}
