import test from 'node:test';
import assert from 'node:assert/strict';
import { serializeBigInt } from '../src/utils/serialization.ts';

test('serializeBigInt: converts top-level BigInt to string', () => {
  const value = 1234567890123456789n;
  const result = serializeBigInt(value);
  assert.equal(result, '1234567890123456789');
  assert.equal(JSON.stringify(result), '"1234567890123456789"');
});

test('serializeBigInt: converts BigInt nested three levels deep', () => {
  const input = {
    level1: {
      level2: {
        level3: 9876543210987654321n,
        regularString: 'hello',
        regularNumber: 42,
      },
    },
  };
  const result = serializeBigInt(input);
  assert.deepEqual(result, {
    level1: {
      level2: {
        level3: '9876543210987654321',
        regularString: 'hello',
        regularNumber: 42,
      },
    },
  });
  const serialized = JSON.stringify(result);
  assert.doesNotThrow(() => JSON.parse(serialized));
  assert.equal(JSON.parse(serialized).level1.level2.level3, '9876543210987654321');
});

test('serializeBigInt: converts BigInt inside array and nested arrays', () => {
  const input = [1n, 2n, [3n, 4n, { val: 5n }], 'unchanged', null, true];
  const result = serializeBigInt(input);
  assert.deepEqual(result, ['1', '2', ['3', '4', { val: '5' }], 'unchanged', null, true]);
  assert.doesNotThrow(() => JSON.stringify(result));
});

test('serializeBigInt: passes null and undefined through unmodified', () => {
  assert.equal(serializeBigInt(null), null);
  assert.equal(serializeBigInt(undefined), undefined);
  assert.deepEqual(serializeBigInt({ a: null, b: undefined }), { a: null, b: undefined });
  assert.doesNotThrow(() => JSON.stringify(serializeBigInt({ a: null, b: undefined })));
});

test('serializeBigInt: documents current handling of Buffer and Map instances', () => {
  // Buffer is an object (Uint8Array subclass). Object.entries on Buffer enumerates its byte indices.
  const buf = Buffer.from('abc');
  const bufResult: any = serializeBigInt(buf);
  // Object.entries on Buffer returns indexed properties {'0': 97, '1': 98, '2': 99}
  assert.equal(typeof bufResult, 'object');
  assert.equal(bufResult[0], 97);
  assert.equal(bufResult[1], 98);
  assert.equal(bufResult[2], 99);
  assert.doesNotThrow(() => JSON.stringify(bufResult));

  // Map has no enumerable own properties via Object.entries, so serializeBigInt returns an empty object {}
  const map = new Map<string, any>([['key', 100n]]);
  const mapResult = serializeBigInt(map);
  assert.deepEqual(mapResult, {});
  assert.doesNotThrow(() => JSON.stringify(mapResult));
});
