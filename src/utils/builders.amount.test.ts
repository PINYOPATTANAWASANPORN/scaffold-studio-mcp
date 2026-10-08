import test from 'node:test';
import assert from 'node:assert/strict';
import { formatTokenAmount, parseTokenAmount } from '../src/utils/builders.ts';

test('round-trip: whole numbers convert and invert cleanly', () => {
  const wholeCases = ['0', '1', '10', '100', '1000', '1000000'];
  for (const amount of wholeCases) {
    const formatted = formatTokenAmount(amount, 7);
    const parsed = parseTokenAmount(formatted, 7);
    assert.equal(parsed, amount, `Expected ${amount} to invert via parseTokenAmount`);
  }
});

test('round-trip: fractional amounts up to 7 decimals invert accurately', () => {
  const fractionalCases = [
    '0.1',
    '0.01',
    '0.001',
    '0.0001',
    '0.00001',
    '0.000001',
    '0.0000001',
    '1.5',
    '123.456789',
    '99.9999999',
  ];
  for (const amount of fractionalCases) {
    const formatted = formatTokenAmount(amount, 7);
    const parsed = parseTokenAmount(formatted, 7);
    assert.equal(parsed, amount, `Expected ${amount} to invert accurately`);
  }
});

test('round-trip: 0 decimals behaves as pure integer', () => {
  const zeroDecimalCases = ['0', '1', '42', '9999'];
  for (const amount of zeroDecimalCases) {
    const formatted = formatTokenAmount(amount, 0);
    const parsed = parseTokenAmount(formatted, 0);
    assert.equal(parsed, amount, `Expected ${amount} with 0 decimals to round-trip`);
  }
});

test('round-trip: handles trailing zeros and zero amounts explicitly', () => {
  // parseTokenAmount('0', 7) returns '0'
  assert.equal(parseTokenAmount('0', 7), '0');

  // formatTokenAmount('100', 7) produces contract amount '1000000000'
  const contractAmount = formatTokenAmount('100', 7);
  assert.equal(contractAmount, '1000000000');
  assert.equal(parseTokenAmount('1000000000', 7), '100');
});

test('round-trip: documents precision boundary where float path diverges from exact decimal arithmetic', () => {
  // JavaScript double precision has 53 bits of mantissa (~15-17 significant decimal digits).
  // Number.MAX_SAFE_INTEGER is 9007199254740991 (16 digits).
  // For 7 decimals, amounts exceeding ~900,000,000 (~9 * 10^8) can experience floating-point truncation.
  const safeMax = '900719925';
  const formattedSafe = formatTokenAmount(safeMax, 7);
  assert.equal(parseTokenAmount(formattedSafe, 7), safeMax);

  // Demonstrate that very high precision decimals beyond float53 lose precision in parseFloat:
  const subEpsilon = '0.00000001'; // 8 decimals; formatTokenAmount with 7 decimals truncates to 0
  assert.equal(formatTokenAmount(subEpsilon, 7), '0');
});

test('error handling: throws informative error for non-numeric input', () => {
  const invalidInputs = ['not-a-number', 'abc', '', 'NaN'];
  for (const invalid of invalidInputs) {
    assert.throws(
      () => formatTokenAmount(invalid, 7),
      /Invalid amount/,
      `Expected formatTokenAmount("${invalid}") to throw`,
    );
  }
});
