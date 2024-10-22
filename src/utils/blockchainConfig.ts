import { ethers } from 'ethers';
import { SupportedBlockchains } from './blockchain';
import { PublicKey } from '@solana/web3.js';

export interface TokenConfig {
  name: string;
  symbol: string;
  address: string; // Contract address for ERC20 tokens, empty for native tokens
  decimals: number;
  icon: string;
}

export interface BlockchainConfig {
  id: SupportedBlockchains;
  rpcUrl: string;
  tokens: TokenConfig[];
  isValidAddress: (address: string) => boolean;
  blockExplorerUrl?: string;
}

const polygonTokens: TokenConfig[] = [
  {
    name: 'Polygon',
    symbol: 'POL',
    address: '', // Native token
    decimals: 18,
    icon: '/assets/icons/polygon.svg',
  },
  {
    name: 'ChainLink Token',
    symbol: 'LINK',
    address: '0x0Fd9e8d3aF1aaee056EB9e802c3A762a667b1904', // LINK на Polygon Amoy Testnet
    decimals: 18,
    icon: '/assets/icons/link.svg',
  },
  {
    name: 'USDC',
    symbol: 'USDC',
    address: '0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582', // USDC на Polygon Amoy Testnet
    decimals: 6,
    icon: '/assets/icons/usdc.svg',
  },
  // {
  //   name: 'PoS-WETH',
  //   symbol: 'WETH',
  //   address: '0x52eF3d68BaB452a294342DC3e5f464d7f610f72E', // WETH on Polygon Amoy Testnet
  //   decimals: 18,
  //   icon: '/assets/icons/weth.svg',
  // },
  // {
  //   name: 'DummyERC20Token',
  //   symbol: 'DummyERC20',
  //   address: '0xf3202E7270a10E599394d8A7dA2F4Fbd475e96bA', // Dummy ERC20 on Amoy Testnet
  //   decimals: 18,
  //   icon: '/assets/icons/dummy-erc20.svg',
  // },
  // {
  //   name: 'DummyERC721Token',
  //   symbol: 'DummyERC721',
  //   address: '0x02f83d4110D3595872481f677Ae323D50Aa09209', // Dummy ERC721 on Amoy Testnet
  //   decimals: 0, // NFTs usually don't have decimals
  //   icon: '/assets/icons/dummy-erc721.svg',
  // },
  // {
  //   name: 'DummyERC1155Token',
  //   symbol: 'DummyERC1155',
  //   address: '0x488AfDFef019f511E343becb98B7c24ee02fA639', // Dummy ERC1155 on Amoy Testnet
  //   decimals: 0, // ERC1155 tokens can have varying decimals
  //   icon: '/assets/icons/dummy-erc1155.svg',
  // },
];

const solanaTokens: TokenConfig[] = [
  {
    name: 'Solana',
    symbol: 'SOL',
    address: '', // Native token
    decimals: 9,
    icon: '/assets/icons/solana.svg',
  },
  {
    name: 'USD Coin Dev',
    symbol: 'USDC-Dev',
    address: 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr', // USDC on Solana (SPL Token)
    decimals: 6,
    icon: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  },
  // {
  //   name: 'Tether USD',
  //   symbol: 'USDT',
  //   address: 'Es9vMFrzrB6yk3kJRabMtgzybapC8G4wEGGkZwyTDt1v', // USDT on Solana
  //   decimals: 6,
  //   icon: '/assets/icons/usdt.svg',
  // },
];

export const blockchainConfigs: Record<SupportedBlockchains, BlockchainConfig> = {
  [SupportedBlockchains.SOLANA]: {
    id: SupportedBlockchains.SOLANA,
    rpcUrl: 'https://api.devnet.solana.com',
    tokens: solanaTokens,
    isValidAddress: (address: string) => {
      try {
        new PublicKey(address);
        return true;
      } catch {
        return false;
      }
    },
    blockExplorerUrl: 'https://explorer.solana.com/',
  },
  [SupportedBlockchains.POLYGON]: {
    id: SupportedBlockchains.POLYGON,
    rpcUrl: 'https://rpc.ankr.com/polygon_amoy',
    tokens: polygonTokens,
    isValidAddress: (address: string) => ethers.isAddress(address),
    // blockExplorerUrl: 'https://amoy.polygonscan.com/',
  },
};

export const getBlockchainConfig = (blockchain: SupportedBlockchains): BlockchainConfig => {
  return blockchainConfigs[blockchain];
};
