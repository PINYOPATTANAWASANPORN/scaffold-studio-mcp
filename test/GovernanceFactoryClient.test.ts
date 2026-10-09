import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { GovernanceFactoryClient } from '../src/clients/GovernanceFactoryClient.ts';
import type { GovernanceConfig, GovernanceType } from '../src/clients/GovernanceFactoryClient.ts';
import type { StellarClient } from '../src/core/index.ts';

describe('GovernanceFactoryClient', () => {
  let mockContractMethods: Record<string, any>;
  let capturedConstructorOpts: any;
  let mockStellarClient: StellarClient;

  beforeEach(() => {
    mockContractMethods = {
      deploy_governance: (args: any) => Promise.resolve({ simulated: true, args }),
      get_deployed_governance: () => Promise.resolve(['GA111', 'GA222']),
      get_governance_count: () => Promise.resolve(2),
      get_governance_by_type: (args: any) => Promise.resolve([{ address: 'GA111', type: args.governance_type }]),
      get_governance_by_admin: (args: any) => Promise.resolve([{ address: 'GA111', admin: args.admin }]),
    };
    capturedConstructorOpts = null;

    mockStellarClient = {
      getAddress: () => 'GBTESTADMINADDRESSFORSTELLARCLIENT123456789',
      getNetwork: () => ({
        name: 'testnet',
        networkPassphrase: 'Test SDF Network ; September 2015',
        rpcUrl: 'https://soroban-testnet.stellar.org',
      }),
      signTransaction: async (xdr: string) => xdr + '_signed',
    } as unknown as StellarClient;
  });

  function createClientWithMock(): GovernanceFactoryClient {
    const client = new GovernanceFactoryClient(mockStellarClient);
    (client as any).contract = {
      deploy_governance: async (args: any) => mockContractMethods.deploy_governance(args),
      get_deployed_governance: async () => mockContractMethods.get_deployed_governance(),
      get_governance_count: async () => mockContractMethods.get_governance_count(),
      get_governance_by_type: async (args: any) => mockContractMethods.get_governance_by_type(args),
      get_governance_by_admin: async (args: any) => mockContractMethods.get_governance_by_admin(args),
    };
    return client;
  }

  it('deployGovernance forwards deployer and config verbatim with Option types unmarshalled', async () => {
    const client = createClientWithMock();
    let capturedDeployArgs: any = null;

    mockContractMethods.deploy_governance = async (args: any) => {
      capturedDeployArgs = args;
      return { result: 'CGDEPLOYEDGOVERNANCEADDRESS123' };
    };

    const config: GovernanceConfig = {
      admin: 'GBADMIN123456789',
      governance_type: { tag: 'MerkleVoting', values: undefined as unknown as void },
      owners: { tag: 'Some', values: ['GBOWNER1', 'GBOWNER2'] },
      threshold: { tag: 'Some', values: [2] },
      root_hash: { tag: 'None', values: [] },
      salt: Buffer.from('0123456789abcdef0123456789abcdef', 'hex'),
    };

    const res = await client.deployGovernance('GBDEPLOYER123', config);

    assert.deepEqual(res, { result: 'CGDEPLOYEDGOVERNANCEADDRESS123' });
    assert.equal(capturedDeployArgs.deployer, 'GBDEPLOYER123');
    assert.deepEqual(capturedDeployArgs.config, config);
    assert.equal(capturedDeployArgs.config.owners.tag, 'Some');
    assert.deepEqual(capturedDeployArgs.config.owners.values, ['GBOWNER1', 'GBOWNER2']);
    assert.equal(capturedDeployArgs.config.threshold.tag, 'Some');
    assert.deepEqual(capturedDeployArgs.config.threshold.values, [2]);
  });

  it('getGovernanceByType forwards GovernanceType tag object correctly for MerkleVoting and Multisig', async () => {
    const client = createClientWithMock();
    let capturedTypeArgs: any = null;

    mockContractMethods.get_governance_by_type = async (args: any) => {
      capturedTypeArgs = args;
      return [{ address: 'CGMERKLEVOTING123' }];
    };

    const merkleType: GovernanceType = { tag: 'MerkleVoting', values: undefined as unknown as void };
    const res = await client.getGovernanceByType(merkleType);

    assert.deepEqual(res, [{ address: 'CGMERKLEVOTING123' }]);
    assert.deepEqual(capturedTypeArgs, { governance_type: { tag: 'MerkleVoting', values: undefined } });

    const multisigType: GovernanceType = { tag: 'Multisig', values: undefined as unknown as void };
    await client.getGovernanceByType(multisigType);
    assert.deepEqual(capturedTypeArgs, { governance_type: { tag: 'Multisig', values: undefined } });
  });

  it('getGovernanceByAdmin forwards admin string correctly', async () => {
    const client = createClientWithMock();
    let capturedAdminArgs: any = null;

    mockContractMethods.get_governance_by_admin = async (args: any) => {
      capturedAdminArgs = args;
      return [{ address: 'CGADMINMATCHED123' }];
    };

    const res = await client.getGovernanceByAdmin('GBEXPECTEDADMIN');
    assert.deepEqual(res, [{ address: 'CGADMINMATCHED123' }]);
    assert.deepEqual(capturedAdminArgs, { admin: 'GBEXPECTEDADMIN' });
  });

  it('getGovernanceCount invokes get_governance_count without arguments', async () => {
    const client = createClientWithMock();
    let called = false;

    mockContractMethods.get_governance_count = async () => {
      called = true;
      return 5;
    };

    const count = await client.getGovernanceCount();
    assert.equal(count, 5);
    assert.equal(called, true);
  });

  it('getDeployedGovernance invokes get_deployed_governance without arguments', async () => {
    const client = createClientWithMock();
    let called = false;

    mockContractMethods.get_deployed_governance = async () => {
      called = true;
      return [{ address: 'CGGOV1' }, { address: 'CGGOV2' }];
    };

    const deployed = await client.getDeployedGovernance();
    assert.equal(called, true);
    assert.equal(deployed.length, 2);
  });
});
