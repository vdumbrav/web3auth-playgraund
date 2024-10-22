import { IBlockchainService } from './IBlockchainService';
import { SolanaService } from './SolanaService';
import { PolygonService } from './PolygonService';
import { SupportedBlockchains } from '../utils/blockchain';
import { web3AuthManager } from '../utils/web3auth';

export class BlockchainServiceFactory {
  private static services: Partial<Record<SupportedBlockchains, IBlockchainService>> = {};

  static getService(blockchain: SupportedBlockchains): IBlockchainService {
    if (!BlockchainServiceFactory.services[blockchain]) {
      switch (blockchain) {
        case SupportedBlockchains.SOLANA:
          BlockchainServiceFactory.services[blockchain] = new SolanaService();
          break;
        case SupportedBlockchains.POLYGON: {
          const web3auth = web3AuthManager;
          const provider = web3auth.getPolygonProvider();
          BlockchainServiceFactory.services[blockchain] = new PolygonService(provider);
          break;
        }
        default:
          throw new Error(`Unsupported blockchain: ${blockchain}`);
      }
    }

    return BlockchainServiceFactory.services[blockchain]!;
  }
}
