/**
 * Tests for the salt generation utilities (issue #3).
 *
 * Run with: node --test test/   (or: npm test)
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  generateSalt,
  generateDeterministicSalt,
  generateMultipleSalts,
} from "../src/utils/salt.ts";

describe("generateSalt", () => {
  it("returns a 64-character lowercase hex string", () => {
    assert.match(generateSalt(), /^[0-9a-f]{64}$/);
  });

  it("produces 200 consecutive unique salts", () => {
    const salts = Array.from({ length: 200 }, () => generateSalt());
    assert.equal(new Set(salts).size, 200);
  });
});

describe("generateMultipleSalts", () => {
  it("returns exactly 50 unique values for count = 50", () => {
    const salts = generateMultipleSalts(50);
    assert.equal(salts.length, 50);
    assert.equal(new Set(salts).size, 50);
  });

  it("works for count = 1", () => {
    const salts = generateMultipleSalts(1);
    assert.equal(salts.length, 1);
    assert.match(salts[0], /^[0-9a-f]{64}$/);
  });

  it("works for count = 100", () => {
    const salts = generateMultipleSalts(100);
    assert.equal(salts.length, 100);
    assert.equal(new Set(salts).size, 100);
  });
});

describe("generateDeterministicSalt", () => {
  it("is stable for the same seed", () => {
    assert.equal(generateDeterministicSalt("x"), generateDeterministicSalt("x"));
  });

  it("differs for different seeds", () => {
    assert.notEqual(generateDeterministicSalt("x"), generateDeterministicSalt("y"));
  });

  it("produces a 64-character lowercase hex digest", () => {
    assert.match(generateDeterministicSalt("x"), /^[0-9a-f]{64}$/);
  });
});
