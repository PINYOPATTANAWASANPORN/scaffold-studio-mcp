/**
 * Tests for the network-scoped `allowHttp` policy (issue #93).
 *
 * Run with: node --test test/   (or: npm test)
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  NETWORKS,
  allowHttpForNetwork,
  assertMainnetRpcIsSecure,
} from "../src/registry/networks.ts";
import type { Network } from "../src/core/types.ts";

describe("allowHttpForNetwork", () => {
  it("permits plaintext HTTP only for the local network", () => {
    assert.equal(allowHttpForNetwork("local"), true);
    assert.equal(allowHttpForNetwork("testnet"), false);
    assert.equal(allowHttpForNetwork("mainnet"), false);
  });

  it("stays in sync with every configured network", () => {
    const names = Object.keys(NETWORKS) as Network[];
    assert.deepEqual([...names].sort(), ["local", "mainnet", "testnet"]);
    for (const name of names) {
      assert.equal(allowHttpForNetwork(name), name === "local", name);
    }
  });
});

describe("assertMainnetRpcIsSecure", () => {
  it("throws when starting on mainnet with an http:// RPC URL", () => {
    assert.throws(
      () => assertMainnetRpcIsSecure("mainnet", "http://soroban.stellar.org"),
      /non-HTTPS/,
    );
  });

  it("accepts the configured mainnet RPC URL", () => {
    assert.doesNotThrow(() =>
      assertMainnetRpcIsSecure("mainnet", NETWORKS.mainnet.rpcUrl),
    );
  });

  it("does not restrict testnet or local networks", () => {
    assert.doesNotThrow(() =>
      assertMainnetRpcIsSecure("testnet", "http://localhost:8000/rpc"),
    );
    assert.doesNotThrow(() =>
      assertMainnetRpcIsSecure("local", NETWORKS.local.rpcUrl),
    );
  });
});
