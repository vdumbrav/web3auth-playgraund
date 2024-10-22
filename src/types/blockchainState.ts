import { SupportedBlockchains } from '../utils/blockchain';

export interface BlockchainInfo {
  status: string | null;
  publicKey: string;
}

export type BlockchainState = Partial<Record<SupportedBlockchains, BlockchainInfo>>;
