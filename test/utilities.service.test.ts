import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { UtilitiesService } from '../src/plugins/utilities/utilities.service.ts';
import type { StellarClient } from '../../core/WalletClientBase.js';

describe('UtilitiesService', () => {
  const service = new UtilitiesService();
  const mockClient = {} as StellarClient;

  describe('generateMultipleSalts', () => {
    it('throws error when count is 0 (below lower bound)', async () => {
      await assert.rejects(
        () => service.generateMultipleSalts(mockClient, { count: 0 }),
        {
          name: 'Error',
          message: 'Count must be between 1 and 100',
        }
      );
    });

    it('throws error when count is 101 (above upper bound)', async () => {
      await assert.rejects(
        () => service.generateMultipleSalts(mockClient, { count: 101 }),
        {
          name: 'Error',
          message: 'Count must be between 1 and 100',
        }
      );
    });

    it('accepts exact lower bound count of 1', async () => {
      const res = await service.generateMultipleSalts(mockClient, { count: 1 });
      assert.equal(res.count, 1);
      assert.equal(res.salts.length, 1);
      assert.match(res.salts[0], /^[0-9a-f]{64}$/);
    });

    it('accepts exact upper bound count of 100', async () => {
      const res = await service.generateMultipleSalts(mockClient, { count: 100 });
      assert.equal(res.count, 100);
      assert.equal(res.salts.length, 100);
      assert.equal(new Set(res.salts).size, 100);
    });
  });

  describe('createMerkleRoot', () => {
    it('throws error when addresses array is empty', async () => {
      await assert.rejects(
        () => service.createMerkleRoot(mockClient, { addresses: [] }),
        {
          name: 'Error',
          message: 'Address list cannot be empty',
        }
      );
    });

    it('creates merkle root for valid voter addresses', async () => {
      const addresses = [
        'GBTESTADDRESSFORVOTER1111111111111111111111111111111111',
        'GBTESTADDRESSFORVOTER2222222222222222222222222222222222',
      ];
      const res = await service.createMerkleRoot(mockClient, { addresses });
      assert.equal(res.leaf_count, 2);
      assert.equal(typeof res.root, 'string');
      assert.ok(res.root.length > 0);
      assert.ok(res.description.includes('2 voters'));
    });
  });

  describe('buildMerkleTree', () => {
    it('returns a plain-object proofs map (not a Map) on a two-voter tree', async () => {
      const voter1 = 'GBTESTADDRESSFORVOTER1111111111111111111111111111111111';
      const voter2 = 'GBTESTADDRESSFORVOTER2222222222222222222222222222222222';
      const voters = [
        { address: voter1, voting_power: '100' },
        { address: voter2, voting_power: '200' },
      ];

      const res = await service.buildMerkleTree(mockClient, { voters });

      assert.equal(res.voter_count, 2);
      assert.equal(typeof res.root, 'string');
      // Assert that proofs is a plain object, not a Map instance
      assert.equal(res.proofs instanceof Map, false);
      assert.equal(typeof res.proofs, 'object');
      assert.notEqual(res.proofs, null);
      assert.ok(Array.isArray(res.proofs[voter1]));
      assert.ok(Array.isArray(res.proofs[voter2]));
    });
  });

  describe('validateAddress', () => {
    it('classifies a G... valid public key as public_key', async () => {
      // Valid Stellar 56-character Ed25519 public key
      const publicKey = 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H';
      const res = await service.validateAddress(mockClient, { address: publicKey });
      assert.equal(res.valid, true);
      assert.equal(res.address, publicKey);
      assert.equal(res.type, 'public_key');
    });

    it('classifies a C... valid contract address as contract', async () => {
      // Valid Stellar 56-character Contract address
      const contractAddress = 'CA3D5KRYMCMCZKHS7KJDQ26XRUCXDNDKA37TM52HQ6TVMWCZ35T45BTI';
      const res = await service.validateAddress(mockClient, { address: contractAddress });
      assert.equal(res.valid, true);
      assert.equal(res.address, contractAddress);
      assert.equal(res.type, 'contract');
    });

    it('returns {valid: false} with no type for not-an-address', async () => {
      const res = await service.validateAddress(mockClient, { address: 'not-an-address' });
      assert.equal(res.valid, false);
      assert.equal(res.address, 'not-an-address');
      assert.equal(res.type, undefined);
    });
  });

  describe('generateSalt', () => {
    it('generates a 64-character hex salt string', async () => {
      const res = await service.generateSalt(mockClient, {});
      assert.match(res.salt, /^[0-9a-f]{64}$/);
      assert.ok(res.description.includes('32-byte random salt'));
    });
  });
});
