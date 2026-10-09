import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { NFTContractClient } from '../src/clients/NFTContractClient.ts';
import type { StellarClient } from '../src/core/index.ts';

describe('NFTContractClient', () => {
  let mockContract: Record<string, any>;
  let mockStellarClient: StellarClient;

  beforeEach(() => {
    mockContract = {
      balance: async (args: any) => ({ balance: 10, ...args }),
      owner_of: async (args: any) => ({ owner: 'GBOWNER123', ...args }),
      get_approved: async (args: any) => ({ approved: 'GBAPPROVED123', ...args }),
      is_approved_for_all: async (args: any) => ({ is_approved: true, ...args }),
      token_uri: async (args: any) => ({ uri: 'https://example.com/nft/1', ...args }),
      name: async () => 'TestNFT',
      symbol: async () => 'TNFT',
      total_supply: async () => 100,
      get_owner_token_id: async (args: any) => ({ token_id: 42, ...args }),
      get_token_id: async (args: any) => ({ token_id: 99, ...args }),
      mint: async (args: any) => ({ success: true, ...args }),
      transfer: async (args: any) => ({ success: true, ...args }),
      transfer_from: async (args: any) => ({ success: true, ...args }),
      approve: async (args: any) => ({ success: true, ...args }),
      approve_for_all: async (args: any) => ({ success: true, ...args }),
      burn: async (args: any) => ({ success: true, ...args }),
      burn_from: async (args: any) => ({ success: true, ...args }),
    };

    mockStellarClient = {
      getAddress: () => 'GBCLIENTADDRESSFORSTELLAR123456789',
      getNetwork: () => ({
        name: 'testnet',
        networkPassphrase: 'Test SDF Network ; September 2015',
        rpcUrl: 'https://soroban-testnet.stellar.org',
      }),
      signTransaction: async (xdr: string) => xdr + '_signed',
    } as unknown as StellarClient;
  });

  function createClient(): NFTContractClient {
    const client = new NFTContractClient('CAKTESTNFTCONTRACTADDRESS123', mockStellarClient);
    (client as any).contract = {
      balance: async (args: any) => mockContract.balance(args),
      owner_of: async (args: any) => mockContract.owner_of(args),
      get_approved: async (args: any) => mockContract.get_approved(args),
      is_approved_for_all: async (args: any) => mockContract.is_approved_for_all(args),
      token_uri: async (args: any) => mockContract.token_uri(args),
      name: async () => mockContract.name(),
      symbol: async () => mockContract.symbol(),
      total_supply: async () => mockContract.total_supply(),
      get_owner_token_id: async (args: any) => mockContract.get_owner_token_id(args),
      get_token_id: async (args: any) => mockContract.get_token_id(args),
      mint: async (args: any) => mockContract.mint(args),
      transfer: async (args: any) => mockContract.transfer(args),
      transfer_from: async (args: any) => mockContract.transfer_from(args),
      approve: async (args: any) => mockContract.approve(args),
      approve_for_all: async (args: any) => mockContract.approve_for_all(args),
      burn: async (args: any) => mockContract.burn(args),
      burn_from: async (args: any) => mockContract.burn_from(args),
    };
    return client;
  }

  it('transfer converts tokenId into token_id key', async () => {
    const client = createClient();
    let captured: any = null;
    mockContract.transfer = async (args: any) => {
      captured = args;
      return { tx: 'transferred' };
    };

    const res = await client.transfer('GBFROM', 'GBTO', 5);
    assert.deepEqual(res, { tx: 'transferred' });
    assert.deepEqual(captured, { from: 'GBFROM', to: 'GBTO', token_id: 5 });
  });

  it('approve maps arguments to snake_case including live_until_ledger', async () => {
    const client = createClient();
    let captured: any = null;
    mockContract.approve = async (args: any) => {
      captured = args;
      return { tx: 'approved' };
    };

    const res = await client.approve('GBAPPROVER', 'GBAPPROVED', 3, 7);
    assert.deepEqual(res, { tx: 'approved' });
    assert.deepEqual(captured, {
      approver: 'GBAPPROVER',
      approved: 'GBAPPROVED',
      token_id: 3,
      live_until_ledger: 7,
    });
  });

  it('getApproved returns Option<string> shape unchanged for Some and None', async () => {
    const client = createClient();

    // Case 1: Some
    mockContract.get_approved = async (args: any) => {
      assert.deepEqual(args, { token_id: 12 });
      return { tag: 'Some', values: ['GBAPPROVEDACCOUNT'] };
    };
    const someResult = await client.getApproved(12);
    assert.deepEqual(someResult, { tag: 'Some', values: ['GBAPPROVEDACCOUNT'] });

    // Case 2: None
    mockContract.get_approved = async (args: any) => {
      assert.deepEqual(args, { token_id: 13 });
      return { tag: 'None', values: [] };
    };
    const noneResult = await client.getApproved(13);
    assert.deepEqual(noneResult, { tag: 'None', values: [] });
  });

  it('burnFrom forwards spender, from, and token_id', async () => {
    const client = createClient();
    let captured: any = null;
    mockContract.burn_from = async (args: any) => {
      captured = args;
      return { tx: 'burned_from' };
    };

    const res = await client.burnFrom('GBSPENDER', 'GBFROM', 24);
    assert.deepEqual(res, { tx: 'burned_from' });
    assert.deepEqual(captured, {
      spender: 'GBSPENDER',
      from: 'GBFROM',
      token_id: 24,
    });
  });

  it('burn forwards from and token_id', async () => {
    const client = createClient();
    let captured: any = null;
    mockContract.burn = async (args: any) => {
      captured = args;
      return { tx: 'burned' };
    };

    const res = await client.burn('GBOWNER', 99);
    assert.deepEqual(res, { tx: 'burned' });
    assert.deepEqual(captured, { from: 'GBOWNER', token_id: 99 });
  });

  it('transferFrom forwards spender, from, to, and token_id', async () => {
    const client = createClient();
    let captured: any = null;
    mockContract.transfer_from = async (args: any) => {
      captured = args;
      return { tx: 'transferred_from' };
    };

    const res = await client.transferFrom('GBSPENDER', 'GBFROM', 'GBTO', 88);
    assert.deepEqual(res, { tx: 'transferred_from' });
    assert.deepEqual(captured, {
      spender: 'GBSPENDER',
      from: 'GBFROM',
      to: 'GBTO',
      token_id: 88,
    });
  });

  it('approveForAll maps operator and live_until_ledger in snake_case', async () => {
    const client = createClient();
    let captured: any = null;
    mockContract.approve_for_all = async (args: any) => {
      captured = args;
      return { tx: 'approved_for_all' };
    };

    const res = await client.approveForAll('GBOWNER', 'GBOPERATOR', 500);
    assert.deepEqual(res, { tx: 'approved_for_all' });
    assert.deepEqual(captured, {
      owner: 'GBOWNER',
      operator: 'GBOPERATOR',
      live_until_ledger: 500,
    });
  });

  it('queries forward arguments correctly with snake_case mapping', async () => {
    const client = createClient();

    // balance
    let balanceArgs: any = null;
    mockContract.balance = async (args: any) => {
      balanceArgs = args;
      return 15;
    };
    const bal = await client.balance('GBACCOUNT');
    assert.equal(bal, 15);
    assert.deepEqual(balanceArgs, { account: 'GBACCOUNT' });

    // ownerOf
    let ownerArgs: any = null;
    mockContract.owner_of = async (args: any) => {
      ownerArgs = args;
      return 'GBREALOWNER';
    };
    const owner = await client.ownerOf(77);
    assert.equal(owner, 'GBREALOWNER');
    assert.deepEqual(ownerArgs, { token_id: 77 });

    // isApprovedForAll
    let approvedArgs: any = null;
    mockContract.is_approved_for_all = async (args: any) => {
      approvedArgs = args;
      return true;
    };
    const isApp = await client.isApprovedForAll('GBOWNER', 'GBOPERATOR');
    assert.equal(isApp, true);
    assert.deepEqual(approvedArgs, { owner: 'GBOWNER', operator: 'GBOPERATOR' });

    // tokenUri
    let uriArgs: any = null;
    mockContract.token_uri = async (args: any) => {
      uriArgs = args;
      return 'https://example.com/token/1';
    };
    const uri = await client.tokenUri(1);
    assert.equal(uri, 'https://example.com/token/1');
    assert.deepEqual(uriArgs, { token_id: 1 });

    // getOwnerTokenId
    let ownerTokenArgs: any = null;
    mockContract.get_owner_token_id = async (args: any) => {
      ownerTokenArgs = args;
      return 101;
    };
    const otId = await client.getOwnerTokenId('GBOWNER', 2);
    assert.equal(otId, 101);
    assert.deepEqual(ownerTokenArgs, { owner: 'GBOWNER', index: 2 });

    // getTokenId
    let tokenIdxArgs: any = null;
    mockContract.get_token_id = async (args: any) => {
      tokenIdxArgs = args;
      return 202;
    };
    const tId = await client.getTokenId(4);
    assert.equal(tId, 202);
    assert.deepEqual(tokenIdxArgs, { index: 4 });

    // name, symbol, totalSupply
    assert.equal(await client.name(), 'TestNFT');
    assert.equal(await client.symbol(), 'TNFT');
    assert.equal(await client.totalSupply(), 100);

    // mint
    let mintArgs: any = null;
    mockContract.mint = async (args: any) => {
      mintArgs = args;
      return { tx: 'minted' };
    };
    const mintRes = await client.mint('GBRECIPIENT');
    assert.deepEqual(mintRes, { tx: 'minted' });
    assert.deepEqual(mintArgs, { to: 'GBRECIPIENT' });
  });
});
