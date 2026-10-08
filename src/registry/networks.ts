/**
 * Network configurations for Stellar networks
 *
 * Provides network passphrases and RPC/Horizon URLs for local, testnet, and mainnet.
 */

import type { Network, NetworkConfig } from '../core/types.js';

/**
 * Network configurations mapped by network name
 */
export const NETWORKS: Record<Network, NetworkConfig> = {
  local: {
    name: 'local',
    networkPassphrase: 'Standalone Network ; February 2017',
    rpcUrl: 'http://localhost:8000/rpc',
    horizonUrl: 'http://localhost:8000',
  },
  testnet: {
    name: 'testnet',
    networkPassphrase: 'Test SDF Network ; September 2015',
    rpcUrl: 'https://soroban-testnet.stellar.org',
    horizonUrl: 'https://horizon-testnet.stellar.org',
  },
  mainnet: {
    name: 'mainnet',
    networkPassphrase: 'Public Global Stellar Network ; September 2015',
    rpcUrl: 'https://soroban.stellar.org',
    horizonUrl: 'https://horizon.stellar.org',
  },
};

/**
 * Whether plaintext HTTP RPC connections are permitted for a network.
 *
 * Only the local development network runs over plain HTTP. Testnet and
 * mainnet must always use HTTPS, so `allowHttp` is false for them.
 */
export function allowHttpForNetwork(network: Network): boolean {
  return network === 'local';
}

/**
 * Refuse to operate on mainnet unless the resolved RPC URL uses HTTPS.
 *
 * Throws when the network is mainnet and the RPC URL does not start with
 * `https://`, so a misconfigured plaintext endpoint fails fast instead of
 * submitting signed transactions over an insecure connection.
 */
export function assertMainnetRpcIsSecure(network: Network, rpcUrl: string): void {
  if (network === 'mainnet' && !rpcUrl.startsWith('https://')) {
    throw new Error(`Refusing to use a non-HTTPS RPC URL on mainnet: ${rpcUrl}`);
  }
}

/**
 * Get network configuration by name
 */
export function getNetwork(network: Network): NetworkConfig {
  return NETWORKS[network];
}

/**
 * Default network (local for development)
 */
export const DEFAULT_NETWORK: Network = 'local';
