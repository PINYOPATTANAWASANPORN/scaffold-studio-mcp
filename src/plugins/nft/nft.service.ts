/**
 * NFT service with @Tool decorated methods
 *
 * Provides tools for NFT deployment and management via NFTFactory
 */

import { Tool } from '../../core/Tool.decorator.js';
import type { StellarClient, ToolResult } from '../../core/index.js';
import { NFTFactoryClient, type NFTConfig, type NFTType } from '../../clients/index.js';
import type { DeployNFTParams, GetNFTsByTypeParams, GetNFTsByOwnerParams } from './parameters.js';
import { serializeBigInt } from '../../utils/serialization.js';
import { randomBytes } from 'crypto';

export class NFTService {
  /**
   * Deploy a new NFT contract via NFTFactory
   */
  @Tool({
    name: 'nft_deploy',
    description: 'Deploy a new NFT contract (Enumerable, Royalties, or AccessControl)',
  })
  async deployNFT(
    stellarClient: StellarClient,
    params: DeployNFTParams
  ): Promise<ToolResult<string>> {
    try {
      const nftFactory = new NFTFactoryClient(stellarClient);

      // Generate salt if not provided
      const salt = params.salt
        ? Buffer.from(params.salt, 'hex')
        : randomBytes(32);

      // Map NFT type to enum format
      const nftType: NFTType = {
        tag: params.nft_type as any,
        values: undefined as any,
      };

      // Build config based on NFT type
      // SDK expects Option types as undefined for None, or direct values for Some
      const config: NFTConfig = {
        owner: params.owner,
        admin: params.admin || undefined,
        manager: params.manager || undefined,
        nft_type: nftType,
        salt,
        name: params.name || undefined,
        symbol: params.symbol || undefined,
        base_uri: params.base_uri || undefined,
      } as NFTConfig;

      // Deploy NFT
      const assembled = await nftFactory.deployNFT(stellarClient.getAddress(), config);

      // Sign and send
      const { result } = await assembled.signAndSend();
      const nftAddress = result as string;

      return {
        success: true,
        data: nftAddress,
        suggestion: `NFT deployed successfully at ${nftAddress}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to deploy NFT',
      };
    }
  }

  /**
   * Get all deployed NFTs
   */
  @Tool({
    name: 'nft_get_deployed',
    description: 'Get list of all deployed NFTs from NFTFactory',
  })
  async getDeployedNFTs(
    stellarClient: StellarClient
  ): Promise<ToolResult> {
    try {
      const nftFactory = new NFTFactoryClient(stellarClient);
      const assembled = await nftFactory.getDeployedNFTs();

      // Simulate to get result
      const simulation = await assembled.simulate();
      const nfts = simulation.result;

      // Serialize BigInt values before returning
      const serializedNFTs = serializeBigInt(nfts);

      return {
        success: true,
        data: serializedNFTs,
        suggestion: `Found ${nfts.length} deployed NFTs`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get deployed NFTs',
      };
    }
  }

  /**
   * Get NFTs by type
   */
  @Tool({
    name: 'nft_get_by_type',
    description: 'Get NFTs filtered by type (Enumerable, Royalties, AccessControl)',
  })
  async getNFTsByType(
    stellarClient: StellarClient,
    params: GetNFTsByTypeParams
  ): Promise<ToolResult> {
    try {
      const nftFactory = new NFTFactoryClient(stellarClient);

      const nftType: NFTType = {
        tag: params.nft_type as any,
        values: undefined as any,
      };

      const assembled = await nftFactory.getNFTsByType(nftType);
      const simulation = await assembled.simulate();
      const nfts = simulation.result;

      // Serialize BigInt values before returning
      const serializedNFTs = serializeBigInt(nfts);

      return {
        success: true,
        data: serializedNFTs,
        suggestion: `Found ${nfts.length} ${params.nft_type} NFTs`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get NFTs by type',
      };
    }
  }

  /**
   * Get NFTs by owner
   */
  @Tool({
    name: 'nft_get_by_owner',
    description: 'Get NFTs filtered by owner address',
  })
  async getNFTsByOwner(
    stellarClient: StellarClient,
    params: GetNFTsByOwnerParams
  ): Promise<ToolResult> {
    try {
      const nftFactory = new NFTFactoryClient(stellarClient);
      const assembled = await nftFactory.getNFTsByOwner(params.owner);
      const simulation = await assembled.simulate();
      const nfts = simulation.result;

      // Serialize BigInt values before returning
      const serializedNFTs = serializeBigInt(nfts);

      return {
        success: true,
        data: serializedNFTs,
        suggestion: `Found ${nfts.length} NFTs owned by ${params.owner}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get NFTs by owner',
      };
    }
  }

  /**
   * Get NFT count
   */
  @Tool({
    name: 'nft_get_count',
    description: 'Get total number of deployed NFTs',
  })
  async getNFTCount(
    stellarClient: StellarClient
  ): Promise<ToolResult<number>> {
    try {
      const nftFactory = new NFTFactoryClient(stellarClient);
      const assembled = await nftFactory.getNFTCount();
      const simulation = await assembled.simulate();
      const count = simulation.result;

      return {
        success: true,
        data: count,
        suggestion: `Total NFTs: ${count}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get NFT count',
      };
    }
  }
}
