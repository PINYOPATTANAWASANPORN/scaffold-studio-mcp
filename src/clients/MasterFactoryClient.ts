/**
 * MasterFactory contract client wrapper
 *
 * Wraps the generated MasterFactory contract client with convenience methods
 */

import {
  Client as MasterFactoryContract,
  type FactoryInfo,
} from '../../packages/master_factory/dist/index.js';
import type { StellarClient } from '../core/index.js';
import { getContractAddress, allowHttpForNetwork } from '../registry/index.js';

/**
 * MasterFactory client wrapper
 */
export class MasterFactoryClient {
  private contract: MasterFactoryContract;

  constructor(private stellarClient: StellarClient) {
    const network = stellarClient.getNetwork();
    const contractId = getContractAddress('master_factory', network.name);

    this.contract = new MasterFactoryContract({
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
   * Get all deployed factories
   */
  async getDeployedFactories() {
    return await this.contract.get_deployed_factories();
  }
}

// Re-export types for convenience
export type { FactoryInfo };
