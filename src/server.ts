#!/usr/bin/env node

/**
 * Stellar Studio MCP Server
 *
 * Main server entry point - initializes plugins and starts MCP server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Keypair, rpc } from '@stellar/stellar-sdk';
import { StellarClient } from './core/WalletClientBase.js';
import { getNetwork, DEFAULT_NETWORK, allowHttpForNetwork, assertMainnetRpcIsSecure } from './registry/networks.js';
import type { Network, StellarContext } from './core/types.js';
import { TokenPlugin } from './plugins/token/token.plugin.js';
import { NFTPlugin } from './plugins/nft/nft.plugin.js';
import { GovernancePlugin } from './plugins/governance/governance.plugin.js';
import { FactoryPlugin } from './plugins/factory/factory.plugin.js';
import { TokenContractPlugin } from './plugins/token-contract/token-contract.plugin.js';
import { NFTContractPlugin } from './plugins/nft-contract/nft-contract.plugin.js';
import { GovernanceContractPlugin } from './plugins/governance-contract/governance-contract.plugin.js';
import { RegistryPlugin } from './plugins/registry/registry.plugin.js';
import { UtilitiesPlugin } from './plugins/utilities/utilities.plugin.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { createCallToolHandler } from './core/call-tool-handler.js';
import dotenv from 'dotenv';

// Load environment variables silently (suppress verbose output for MCP stdio communication)
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
console.log = () => {};
console.error = () => {};
dotenv.config();
console.log = originalConsoleLog;
console.error = originalConsoleError;


/**
 * Get environment configuration
 */
function getEnvConfig() {
  const secretKey = process.env.STELLAR_SECRET_KEY;
  const network = (process.env.STELLAR_NETWORK || DEFAULT_NETWORK) as Network;

  if (!secretKey) {
    throw new Error(
      'STELLAR_SECRET_KEY environment variable is required. Generate one with: stellar keys generate'
    );
  }

  return { secretKey, network };
}

/**
 * Initialize Stellar client
 */
function initializeStellarClient(secretKey: string, network: Network): StellarClient {
  const networkConfig = getNetwork(network);
  const keypair = Keypair.fromSecret(secretKey);

  // Plaintext HTTP is only permitted for the local development network.
  assertMainnetRpcIsSecure(network, networkConfig.rpcUrl);
  const rpcOptions = { allowHttp: allowHttpForNetwork(network) };
  const rpcServer = new rpc.Server(networkConfig.rpcUrl, rpcOptions);

  const context: StellarContext = {
    keypair,
    rpc: rpcServer,
    network: networkConfig,
  };

  return new StellarClient(context);
}

/**
 * Main server function
 */
async function main() {
  try {
    // Get configuration
    const { secretKey, network } = getEnvConfig();

    // Initialize Stellar client
    const stellarClient = initializeStellarClient(secretKey, network);

    // Initialize plugins
    const plugins = [
      // Factory plugins (deployment)
      new TokenPlugin(),
      new NFTPlugin(),
      new GovernancePlugin(),
      new FactoryPlugin(),
      // Contract interaction plugins
      new TokenContractPlugin(),
      new NFTContractPlugin(),
      new GovernanceContractPlugin(),
      // Registry plugin (CLI integration)
      new RegistryPlugin(),
      // Utilities plugin (helpers for deployment parameters)
      new UtilitiesPlugin(),
    ];

    // Collect all tools from plugins
    const allTools = plugins.flatMap((plugin) => plugin.getTools(stellarClient));

    // Create MCP server
    const server = new Server(
      {
        name: 'stellar-studio',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Register list_tools handler
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: allTools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: zodToJsonSchema(tool.parameters),
        })),
      };
    });

    // Register call_tool handler
    server.setRequestHandler(CallToolRequestSchema, createCallToolHandler(allTools));

    // Connect to STDIO transport
    const transport = new StdioServerTransport();
    await server.connect(transport);

    // Log startup info to stderr (after MCP connection established)
    console.error(`Stellar Studio MCP Server v1.0.0`);
    console.error(`Network: ${network} | Address: ${stellarClient.getAddress()}`);
    console.error(`Registered ${allTools.length} tools from ${plugins.length} plugins`);

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.error('Shutting down...');
      await server.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.error('Shutting down...');
      await server.close();
      process.exit(0);
    });
  } catch (error: any) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

// Start the server
main();
