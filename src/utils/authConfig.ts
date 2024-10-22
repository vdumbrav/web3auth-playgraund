import { AuthAdapterOptions } from '@web3auth/auth-adapter';
import { CHAIN_NAMESPACES, IBaseProvider, IWeb3AuthCoreOptions } from '@web3auth/base';
import { CustomChainConfig } from '@web3auth/base';

const clientId = import.meta.env.VITE_CLIENT_ID_WEB3AUTH || ''; // Your Web3Auth client ID
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''; // Google OAuth Client ID
// const polygonApiKey = import.meta.env.VITE_POLYGONSCAN_API_KEY || ''; // Fetch API key from .env

// Polygon Amoy Testnet configuration
export const polygonChainConfig: CustomChainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: '0x13882',
  rpcTarget: 'https://rpc.ankr.com/polygon_amoy',
  displayName: 'Polygon Amoy Testnet',
  blockExplorerUrl: 'https://amoy.polygonscan.com/',
  ticker: 'POL',
  tickerName: 'Polygon Ecosystem Token',
};

// Solana Devnet configuration
export const solanaChainConfig: CustomChainConfig = {
  chainNamespace: CHAIN_NAMESPACES.SOLANA,
  chainId: '0x3', // Solana Devnet
  rpcTarget: 'https://api.devnet.solana.com',
  displayName: 'Solana Devnet',
  blockExplorerUrl: 'https://explorer.solana.com/',
  ticker: 'SOL',
  tickerName: 'Solana Token',
};

// Function to get Web3Auth options configuration
export const getAuthConfig = async (
  privateKeyProvider: IBaseProvider<string>,
  chainConfig: CustomChainConfig,
): Promise<IWeb3AuthCoreOptions> => {
  return {
    clientId,
    web3AuthNetwork: 'sapphire_devnet',
    chainConfig, // Use the passed chain config
    uiConfig: {
      appName: 'My Crypto Wallet',
      defaultLanguage: 'en',
      theme: {
        primary: '#0056b3',
        onPrimary: '#fafafa',
      },
    },
    privateKeyProvider, // Blockchain-specific private key provider
  };
};

// Authentication adapter config
export const authAdapterConfig: AuthAdapterOptions = {
  adapterSettings: {
    uxMode: 'redirect',
    loginConfig: {
      email_passwordless: {
        typeOfLogin: 'email_passwordless',
        verifier: 'agg-multiple-verifier',
        verifierSubIdentifier: 'email_passwordless-verifier',
      },
      google: {
        typeOfLogin: 'google',
        verifier: 'agg-multiple-verifier',
        verifierSubIdentifier: 'google-verifier',
        clientId: googleClientId,
      },
    },
  },
};
