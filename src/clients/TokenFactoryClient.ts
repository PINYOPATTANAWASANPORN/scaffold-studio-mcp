/**
 * TokenFactory contract client wrapper
 *
 * Wraps the generated TokenFactory contract client with convenience methods
 */

import {
  Client as TokenFactoryContract,
  type TokenConfig,
  type TokenInfo,
  type TokenType,
} from '../../packages/token_factory/dist/index.js';
import type { StellarClient } from '../core/index.js';
import { getContractAddress, allowHttpForNetwork } from '../registry/index.js';

/**
 * TokenFactory client wrapper
 */
export class TokenFactoryClient {
  private contract: TokenFactoryContract;

  constructor(private stellarClient: StellarClient) {
    const network = stellarClient.getNetwork();
    const contractId = getContractAddress('token_factory', network.name);

    this.contract = new TokenFactoryContract({
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
   * Deploy a new token contract
   *
   * @param deployer - Address of the deployer
   * @param config - Token configuration
   * @returns AssembledTransaction that can be signed and sent
   */
  async deployToken(deployer: string, config: TokenConfig) {
    return await this.contract.deploy_token({
      deployer,
      config,
    });
  }

  /**
   * Get all deployed tokens
   *
   * @returns AssembledTransaction that resolves to array of TokenInfo
   */
  async getDeployedTokens() {
    return await this.contract.get_deployed_tokens();
  }

  /**
   * Get tokens by type
   *
   * @param tokenType - Type of token to filter by
   * @returns AssembledTransaction that resolves to array of TokenInfo
   */
  async getTokensByType(tokenType: TokenType) {
    return await this.contract.get_tokens_by_type({
      token_type: tokenType,
    });
  }

  /**
   * Get token count
   *
   * @returns AssembledTransaction that resolves to token count
   */
  async getTokenCount() {
    return await this.contract.get_token_count();
  }

  /**
   * Get tokens by admin
   *
   * @param admin - Admin address to filter by
   * @returns AssembledTransaction that resolves to array of TokenInfo
   */
  async getTokensByAdmin(admin: string) {
    return await this.contract.get_tokens_by_admin({
      admin,
    });
  }
}

// Re-export types for convenience
export type { TokenConfig, TokenInfo, TokenType };
