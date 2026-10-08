/**
 * GovernanceContractClient - Wrapper for MerkleVoting contract interactions
 */
import { Client as GovernanceContract } from '../../packages/merkle_voting_example/dist/index.js';
import type { StellarClient } from '../core/index.js';
import { allowHttpForNetwork } from '../registry/index.js';

export class GovernanceContractClient {
  private contract: GovernanceContract;

  constructor(contractAddress: string, private stellarClient: StellarClient) {
    const network = stellarClient.getNetwork();

    this.contract = new GovernanceContract({
      publicKey: stellarClient.getAddress(),
      contractId: contractAddress,
      networkPassphrase: network.networkPassphrase,
      rpcUrl: network.rpcUrl,
      allowHttp: allowHttpForNetwork(network.name),
      signTransaction: async (xdr: string) => {
        return { signedTxXdr: await stellarClient.signTransaction(xdr) };
      },
    });
  }

  /**
   * Cast a vote with merkle proof
   */
  async vote(voteData: { index: number; account: string; voting_power: string }, proof: Buffer[], approve: boolean) {
    return await this.contract.vote({
      vote_data: {
        index: voteData.index,
        account: voteData.account,
        voting_power: BigInt(voteData.voting_power),
      },
      proof,
      approve,
    });
  }

  /**
   * Check if an address has voted
   */
  async hasVoted(index: number) {
    return await this.contract.has_voted({ index });
  }

  /**
   * Get vote results
   */
  async getVoteResults() {
    return await this.contract.get_vote_results();
  }
}
