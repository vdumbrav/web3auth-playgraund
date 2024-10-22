import { Web3AuthNoModal } from '@web3auth/no-modal';
import { SolanaPrivateKeyProvider, SolanaWallet } from '@web3auth/solana-provider';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { AuthAdapter } from '@web3auth/auth-adapter';
import { IProvider } from '@web3auth/base';
import { Connection } from '@solana/web3.js';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { SupportedBlockchains } from './blockchain';
import { authAdapterConfig, getAuthConfig, polygonChainConfig, solanaChainConfig } from './authConfig';

class Web3AuthManager {
  private static instance: Web3AuthManager;
  private web3auth: Web3AuthNoModal | null = null;
  private solanaWallet: SolanaWallet | null = null;
  private solanaConnection: Connection | null = null;
  private polygonProvider: ethers.BrowserProvider | null = null;

  // Singleton pattern
  static getInstance(): Web3AuthManager {
    if (!Web3AuthManager.instance) {
      Web3AuthManager.instance = new Web3AuthManager();
    }
    return Web3AuthManager.instance;
  }

  // Initialize Web3Auth based on the selected blockchain
  async initWeb3Auth(blockchain: SupportedBlockchains): Promise<Web3AuthNoModal | null> {
    try {
      let privateKeyProvider;
      let chainConfig;

      // Configure blockchain-specific adapters
      switch (blockchain) {
        case SupportedBlockchains.SOLANA:
          privateKeyProvider = new SolanaPrivateKeyProvider({ config: { chainConfig: solanaChainConfig } });
          chainConfig = solanaChainConfig;
          break;
        case SupportedBlockchains.POLYGON:
          privateKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig: polygonChainConfig } });
          chainConfig = polygonChainConfig;
          break;
        default:
          throw new Error(`Unsupported blockchain: ${blockchain}`);
      }

      const authOptions = await getAuthConfig(privateKeyProvider, chainConfig);

      // Clean up previous instances if necessary
      this.cleanup();

      // Initialize Web3Auth instance
      this.web3auth = new Web3AuthNoModal(authOptions);
      const authAdapter = new AuthAdapter(authAdapterConfig);
      this.web3auth.configureAdapter(authAdapter);
      await this.web3auth.init();

      // Initialize blockchain-specific providers
      switch (blockchain) {
        case SupportedBlockchains.SOLANA:
          this.solanaWallet = new SolanaWallet(privateKeyProvider as SolanaPrivateKeyProvider);
          this.solanaConnection = new Connection(chainConfig.rpcTarget, 'confirmed');
          break;
        case SupportedBlockchains.POLYGON: {
          const web3authProvider = this.web3auth.provider;
          if (!web3authProvider) {
            throw new Error('Failed to get Web3Auth provider');
          }
          this.polygonProvider = new ethers.BrowserProvider(web3authProvider);
          break;
        }
      }

      return this.web3auth;
    } catch (error) {
      console.error(`Error initializing Web3Auth for ${blockchain}:`, error);
      toast.error(`Error initializing Web3Auth for ${blockchain}`);
      return null;
    }
  }

  private cleanup() {
    this.web3auth = null;
    this.solanaWallet = null;
    this.solanaConnection = null;
    this.polygonProvider = null;
  }

  getWeb3Auth(): Web3AuthNoModal {
    if (!this.web3auth) {
      throw new Error('Web3Auth is not initialized');
    }
    return this.web3auth;
  }

  getSolanaWallet(): SolanaWallet {
    if (!this.solanaWallet) {
      throw new Error('Solana Wallet is not initialized');
    }
    return this.solanaWallet;
  }

  getSolanaConnection(): Connection {
    if (!this.solanaConnection) {
      throw new Error('Solana Connection is not initialized');
    }
    return this.solanaConnection;
  }
  // Get Polygon Provider
  getPolygonProvider(): ethers.BrowserProvider {
    if (!this.polygonProvider) {
      throw new Error('Polygon provider is not initialized');
    }
    return this.polygonProvider;
  }

  getProvider(): IProvider | null {
    if (!this.web3auth?.provider) {
      throw new Error('Provider is not initialized');
    }
    return this.web3auth.provider;
  }
}

// Export singleton instance
export const web3AuthManager = Web3AuthManager.getInstance();

// Export helper methods
export const initWeb3Auth = (blockchain: SupportedBlockchains) => web3AuthManager.initWeb3Auth(blockchain);
export const getSolanaWallet = () => web3AuthManager.getSolanaWallet();
export const getSolanaConnection = () => web3AuthManager.getSolanaConnection();
export const getPolygonProvider = () => web3AuthManager.getPolygonProvider();
export const getWeb3Auth = () => web3AuthManager.getWeb3Auth();
export const getProvider = () => web3AuthManager.getProvider();
