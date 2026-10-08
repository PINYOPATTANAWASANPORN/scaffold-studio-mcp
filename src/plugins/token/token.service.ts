/**
 * Token service with @Tool decorated methods
 *
 * Provides tools for token deployment and management via TokenFactory
 */

import { Tool } from '../../core/Tool.decorator.js';
import type { StellarClient, ToolResult } from '../../core/index.js';
import { TokenFactoryClient, type TokenConfig, type TokenType } from '../../clients/index.js';
import type { DeployTokenParams, GetTokensByTypeParams, GetTokensByAdminParams } from './parameters.js';
import { serializeBigInt } from '../../utils/serialization.js';
import { randomBytes } from 'crypto';

export class TokenService {
  /**
   * Deploy a new token contract via TokenFactory
   */
  @Tool({
    name: 'token_deploy',
    description: 'Deploy a new token contract (Allowlist, Blocklist, Capped, Pausable, or Vault)',
  })
  async deployToken(
    stellarClient: StellarClient,
    params: DeployTokenParams
  ): Promise<ToolResult<string>> {
    let config: TokenConfig | undefined;
    try {
      const tokenFactory = new TokenFactoryClient(stellarClient);

      // Generate salt if not provided
      const salt = params.salt
        ? Buffer.from(params.salt, 'hex')
        : randomBytes(32);

      // Map token type to enum format
      const tokenType: TokenType = {
        tag: params.token_type as any,
        values: undefined as any,
      };

      // Build config
      // SDK runtime expects Option types as null/undefined for None, or direct values for Some
      // But TypeScript interface expects Option<T> format, so we use type assertion
      const configObj: any = {
        admin: params.admin,
        manager: params.manager,
        name: params.name,
        symbol: params.symbol,
        decimals: params.decimals,
        initial_supply: BigInt(params.initial_supply),
        token_type: tokenType,
        salt,
      };
      
      // Handle Option fields - SDK expects undefined for None, or direct values for Some
      configObj.asset = params.asset || undefined;
      configObj.cap = params.cap ? BigInt(params.cap) : undefined;
      configObj.decimals_offset = params.decimals_offset ?? undefined;
      
      config = configObj as TokenConfig;

      // Deploy token
      const assembled = await tokenFactory.deployToken(stellarClient.getAddress(), config);

      // Sign and send
      const { result } = await assembled.signAndSend();
      const tokenAddress = result as string;

      return {
        success: true,
        data: tokenAddress,
        suggestion: `Token deployed successfully at ${tokenAddress}`,
      };
    } catch (error: any) {
      // Log detailed error for debugging
      const errorDetails = {
        message: error.message,
        stack: error.stack,
        config: config ? JSON.stringify(config, (key, value) => {
          if (typeof value === 'bigint') return value.toString();
          if (value instanceof Buffer) return value.toString('hex');
          return value;
        }) : 'config not created',
      };
      console.error('Token deployment error:', errorDetails);
      
      return {
        success: false,
        error: error.message || 'Failed to deploy token',
      };
    }
  }

  /**
   * Get all deployed tokens
   */
  @Tool({
    name: 'token_get_deployed',
    description: 'Get list of all deployed tokens from TokenFactory',
  })
  async getDeployedTokens(
    stellarClient: StellarClient
  ): Promise<ToolResult> {
    try {
      const tokenFactory = new TokenFactoryClient(stellarClient);
      const assembled = await tokenFactory.getDeployedTokens();

      // Simulate to get result
      const simulation = await assembled.simulate();
      const tokens = simulation.result;

      // Serialize BigInt values before returning
      const serializedTokens = serializeBigInt(tokens);

      return {
        success: true,
        data: serializedTokens,
        suggestion: `Found ${tokens.length} deployed tokens`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get deployed tokens',
      };
    }
  }

  /**
   * Get tokens by type
   */
  @Tool({
    name: 'token_get_by_type',
    description: 'Get tokens filtered by type (Allowlist, Blocklist, Capped, Pausable, Vault)',
  })
  async getTokensByType(
    stellarClient: StellarClient,
    params: GetTokensByTypeParams
  ): Promise<ToolResult> {
    try {
      const tokenFactory = new TokenFactoryClient(stellarClient);

      const tokenType: TokenType = {
        tag: params.token_type as any,
        values: undefined as any,
      };

      const assembled = await tokenFactory.getTokensByType(tokenType);
      const simulation = await assembled.simulate();
      const tokens = simulation.result;

      // Serialize BigInt values before returning
      const serializedTokens = serializeBigInt(tokens);

      return {
        success: true,
        data: serializedTokens,
        suggestion: `Found ${tokens.length} ${params.token_type} tokens`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get tokens by type',
      };
    }
  }

  /**
   * Get tokens by admin
   */
  @Tool({
    name: 'token_get_by_admin',
    description: 'Get tokens filtered by admin address',
  })
  async getTokensByAdmin(
    stellarClient: StellarClient,
    params: GetTokensByAdminParams
  ): Promise<ToolResult> {
    try {
      const tokenFactory = new TokenFactoryClient(stellarClient);
      const assembled = await tokenFactory.getTokensByAdmin(params.admin);
      const simulation = await assembled.simulate();
      const tokens = simulation.result;

      // Serialize BigInt values before returning
      const serializedTokens = serializeBigInt(tokens);

      return {
        success: true,
        data: serializedTokens,
        suggestion: `Found ${tokens.length} tokens managed by ${params.admin}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get tokens by admin',
      };
    }
  }

  /**
   * Get token count
   */
  @Tool({
    name: 'token_get_count',
    description: 'Get total number of deployed tokens',
  })
  async getTokenCount(
    stellarClient: StellarClient
  ): Promise<ToolResult<number>> {
    try {
      const tokenFactory = new TokenFactoryClient(stellarClient);
      const assembled = await tokenFactory.getTokenCount();
      const simulation = await assembled.simulate();
      const count = simulation.result;

      return {
        success: true,
        data: count,
        suggestion: `Total tokens: ${count}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get token count',
      };
    }
  }
}
