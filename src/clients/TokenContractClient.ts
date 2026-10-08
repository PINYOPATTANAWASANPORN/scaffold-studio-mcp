/**
 * Token Contract client wrapper
 *
 * Wraps the generated token contract client to interact with deployed tokens
 * Works with any token type (Allowlist, Blocklist, Capped, Pausable, Vault)
 */

import { Client as TokenContract } from '../../packages/fungible_pausable_example/dist/index.js';
import type { StellarClient } from '../core/index.js';
import { allowHttpForNetwork } from '../registry/index.js';

/**
 * Token Contract client wrapper for interacting with deployed tokens
 */
export class TokenContractClient {
  private contract: TokenContract;

  constructor(contractAddress: string, private stellarClient: StellarClient) {
    const network = stellarClient.getNetwork();

    this.contract = new TokenContract({
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
   * Get token balance
   */
  async balance(account: string) {
    return await this.contract.balance({ account });
  }

  /**
   * Get total supply
   */
  async totalSupply() {
    return await this.contract.total_supply();
  }

  /**
   * Get allowance
   */
  async allowance(owner: string, spender: string) {
    return await this.contract.allowance({ owner, spender });
  }

  /**
   * Get token decimals
   */
  async decimals() {
    return await this.contract.decimals();
  }

  /**
   * Get token name
   */
  async name() {
    return await this.contract.name();
  }

  /**
   * Get token symbol
   */
  async symbol() {
    return await this.contract.symbol();
  }

  /**
   * Check if token is paused (Pausable tokens only)
   */
  async paused() {
    return await this.contract.paused();
  }

  /**
   * Transfer tokens
   */
  async transfer(from: string, to: string, amount: string) {
    return await this.contract.transfer({
      from,
      to,
      amount: BigInt(amount),
    });
  }

  /**
   * Transfer tokens on behalf
   */
  async transferFrom(spender: string, from: string, to: string, amount: string) {
    return await this.contract.transfer_from({
      spender,
      from,
      to,
      amount: BigInt(amount),
    });
  }

  /**
   * Approve spender
   */
  async approve(owner: string, spender: string, amount: string, liveUntilLedger: number) {
    return await this.contract.approve({
      owner,
      spender,
      amount: BigInt(amount),
      live_until_ledger: liveUntilLedger,
    });
  }

  /**
   * Mint new tokens (owner-only)
   */
  async mint(account: string, amount: string) {
    return await this.contract.mint({
      account,
      amount: BigInt(amount),
    });
  }

  /**
   * Burn tokens
   */
  async burn(from: string, amount: string) {
    return await this.contract.burn({
      from,
      amount: BigInt(amount),
    });
  }

  /**
   * Burn tokens on behalf
   */
  async burnFrom(spender: string, from: string, amount: string) {
    return await this.contract.burn_from({
      spender,
      from,
      amount: BigInt(amount),
    });
  }

  /**
   * Pause token (Pausable tokens only)
   */
  async pause(caller: string) {
    return await this.contract.pause({ caller });
  }

  /**
   * Unpause token (Pausable tokens only)
   */
  async unpause(caller: string) {
    return await this.contract.unpause({ caller });
  }
}
