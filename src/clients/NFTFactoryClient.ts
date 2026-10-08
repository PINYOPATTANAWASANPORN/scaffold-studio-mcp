/**
 * NFTFactory contract client wrapper
 *
 * Wraps the generated NFTFactory contract client with convenience methods
 */

import {
  Client as NFTFactoryContract,
  type NFTConfig,
  type NFTInfo,
  type NFTType,
} from '../../packages/nft_factory/dist/index.js';
import type { StellarClient } from '../core/index.js';
import { getContractAddress, allowHttpForNetwork } from '../registry/index.js';

/**
 * NFTFactory client wrapper
 */
export class NFTFactoryClient {
  private contract: NFTFactoryContract;

  constructor(private stellarClient: StellarClient) {
    const network = stellarClient.getNetwork();
    const contractId = getContractAddress('nft_factory', network.name);

    this.contract = new NFTFactoryContract({
      publicKey: stellarClient.getAddress(),
      contractId,
      networkPassphrase: network.networkPassphrase,
      rpcUrl: network.rpcUrl,
      allowHttp: allowHttpForNetwork(network.name),
      signTransaction: async (xdr: string) => {
        return { signedTxXdr: await stellarClient.signTransaction(xdr) };
      },
    });
  }

  /**
   * Deploy a new NFT contract
   */
  async deployNFT(deployer: string, config: NFTConfig) {
    return await this.contract.deploy_nft({
      deployer,
      config,
    });
  }

  /**
   * Get all deployed NFTs
   */
  async getDeployedNFTs() {
    return await this.contract.get_deployed_nfts();
  }

  /**
   * Get NFTs by type
   */
  async getNFTsByType(nftType: NFTType) {
    return await this.contract.get_nfts_by_type({
      nft_type: nftType,
    });
  }

  /**
   * Get NFT count
   */
  async getNFTCount() {
    return await this.contract.get_nft_count();
  }

  /**
   * Get NFTs by owner
   */
  async getNFTsByOwner(owner: string) {
    return await this.contract.get_nfts_by_owner({
      owner,
    });
  }
}

// Re-export types for convenience
export type { NFTConfig, NFTInfo, NFTType };
