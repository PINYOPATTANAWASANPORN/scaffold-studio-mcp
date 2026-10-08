/**
 * GovernanceFactory contract client wrapper
 *
 * Wraps the generated GovernanceFactory contract client with convenience methods
 */

import {
  Client as GovernanceFactoryContract,
  type GovernanceConfig,
  type GovernanceInfo,
  type GovernanceType,
} from '../../packages/governance_factory/dist/index.js';
import type { StellarClient } from '../core/index.js';
import { getContractAddress, allowHttpForNetwork } from '../registry/index.js';

/**
 * GovernanceFactory client wrapper
 */
export class GovernanceFactoryClient {
  private contract: GovernanceFactoryContract;

  constructor(private stellarClient: StellarClient) {
    const network = stellarClient.getNetwork();
    const contractId = getContractAddress('governance_factory', network.name);

    this.contract = new GovernanceFactoryContract({
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
   * Deploy a new governance contract
   */
  async deployGovernance(deployer: string, config: GovernanceConfig) {
    return await this.contract.deploy_governance({
      deployer,
      config,
    });
  }

  /**
   * Get all deployed governance contracts
   */
  async getDeployedGovernance() {
    return await this.contract.get_deployed_governance();
  }

  /**
   * Get governance count
   */
  async getGovernanceCount() {
    return await this.contract.get_governance_count();
  }

  /**
   * Get governance contracts by type
   */
  async getGovernanceByType(governanceType: GovernanceType) {
    return await this.contract.get_governance_by_type({
      governance_type: governanceType,
    });
  }

  /**
   * Get governance contracts by admin
   */
  async getGovernanceByAdmin(admin: string) {
    return await this.contract.get_governance_by_admin({
      admin,
    });
  }
}

// Re-export types for convenience
export type { GovernanceConfig, GovernanceInfo, GovernanceType };
