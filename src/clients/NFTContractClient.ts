/**
 * NFT Contract client wrapper
 *
 * Wraps the generated NFT contract client to interact with deployed NFTs
 */

import { Client as NFTContract } from '../../packages/nft_enumerable_example/dist/index.js';
import type { StellarClient } from '../core/index.js';
import { allowHttpForNetwork } from '../registry/index.js';

/**
 * NFT Contract client wrapper for interacting with deployed NFTs
 */
export class NFTContractClient {
  private contract: NFTContract;

  constructor(contractAddress: string, private stellarClient: StellarClient) {
    const network = stellarClient.getNetwork();

    this.contract = new NFTContract({
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

  // Query methods
  async balance(account: string) {
    return await this.contract.balance({ account });
  }

  async ownerOf(tokenId: number) {
    return await this.contract.owner_of({ token_id: tokenId });
  }

  async getApproved(tokenId: number) {
    return await this.contract.get_approved({ token_id: tokenId });
  }

  async isApprovedForAll(owner: string, operator: string) {
    return await this.contract.is_approved_for_all({ owner, operator });
  }

  async tokenUri(tokenId: number) {
    return await this.contract.token_uri({ token_id: tokenId });
  }

  async name() {
    return await this.contract.name();
  }

  async symbol() {
    return await this.contract.symbol();
  }

  async totalSupply() {
    return await this.contract.total_supply();
  }

  async getOwnerTokenId(owner: string, index: number) {
    return await this.contract.get_owner_token_id({ owner, index });
  }

  async getTokenId(index: number) {
    return await this.contract.get_token_id({ index });
  }

  // Write methods
  async mint(to: string) {
    return await this.contract.mint({ to });
  }

  async transfer(from: string, to: string, tokenId: number) {
    return await this.contract.transfer({ from, to, token_id: tokenId });
  }

  async transferFrom(spender: string, from: string, to: string, tokenId: number) {
    return await this.contract.transfer_from({ spender, from, to, token_id: tokenId });
  }

  async approve(approver: string, approved: string, tokenId: number, liveUntilLedger: number) {
    return await this.contract.approve({
      approver,
      approved,
      token_id: tokenId,
      live_until_ledger: liveUntilLedger,
    });
  }

  async approveForAll(owner: string, operator: string, liveUntilLedger: number) {
    return await this.contract.approve_for_all({
      owner,
      operator,
      live_until_ledger: liveUntilLedger,
    });
  }

  async burn(from: string, tokenId: number) {
    return await this.contract.burn({ from, token_id: tokenId });
  }

  async burnFrom(spender: string, from: string, tokenId: number) {
    return await this.contract.burn_from({ spender, from, token_id: tokenId });
  }
}
