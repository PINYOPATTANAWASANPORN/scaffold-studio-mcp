/**
 * Validation utilities for contract parameters
 *
 * Validates addresses, amounts, and configurations before deployment
 */

import { StrKey } from '@stellar/stellar-sdk';

/**
 * Validate Stellar address format
 * @param address - Address string to validate
 * @returns true if valid Stellar address
 */
export function isValidAddress(address: string): boolean {
  try {
    // Check if it's a valid public key (G...) or contract address (C...)
    return (
      StrKey.isValidEd25519PublicKey(address) ||
      StrKey.isValidContract(address)
    );
  } catch {
    return false;
  }
}

/**
 * Validate and throw if address is invalid
 * @param address - Address to validate
 * @param fieldName - Name of the field for error message
 */
export function requireValidAddress(address: string, fieldName: string): void {
  if (!isValidAddress(address)) {
    throw new Error(`Invalid ${fieldName} address: ${address}`);
  }
}

/**
 * Validate token name
 * @param name - Token name
 * @returns true if valid
 */
export function isValidTokenName(name: string): boolean {
  return name.length > 0 && name.length <= 100;
}

/**
 * Validate token symbol
 * @param symbol - Token symbol
 * @returns true if valid
 */
export function isValidTokenSymbol(symbol: string): boolean {
  return symbol.length > 0 && symbol.length <= 32 && /^[A-Z0-9]+$/.test(symbol);
}

/**
 * Validate token decimals
 * @param decimals - Number of decimals
 * @returns true if valid (0-18)
 */
export function isValidDecimals(decimals: number): boolean {
  return Number.isInteger(decimals) && decimals >= 0 && decimals <= 18;
}

/**
 * Validate token amount
 * @param amount - Amount to validate
 * @returns true if valid (positive integer)
 */
export function isValidAmount(amount: string | number): boolean {
  const num = typeof amount === 'string' ? parseInt(amount) : amount;
  return Number.isInteger(num) && num > 0;
}


/**
 * Validate salt format (32-byte hex string)
 * @param salt - Salt to validate
 * @returns true if valid
 */
export function isValidSalt(salt: string): boolean {
  return /^[0-9a-f]{64}$/i.test(salt);
}

/**
 * Validate cap is greater than initial supply
 * @param initialSupply - Initial supply
 * @param cap - Maximum cap
 * @returns true if valid
 */
export function isValidCap(initialSupply: string, cap: string): boolean {
  const supply = BigInt(initialSupply);
  const maximum = BigInt(cap);
  return maximum >= supply;
}

/**
 * Token configuration validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate complete token configuration
 * @param config - Token configuration object
 * @returns Validation result with errors if any
 */
export function validateTokenConfig(config: {
  admin: string;
  manager: string;
  initial_supply: string;
  cap?: string;
  name: string;
  symbol: string;
  decimals: number;
  salt: string;
}): ValidationResult {
  const errors: string[] = [];

  // Validate addresses
  if (!isValidAddress(config.admin)) {
    errors.push(`Invalid admin address: ${config.admin}`);
  }
  if (!isValidAddress(config.manager)) {
    errors.push(`Invalid manager address: ${config.manager}`);
  }

  // Validate amounts
  if (!isValidAmount(config.initial_supply)) {
    errors.push(`Invalid initial supply: ${config.initial_supply}`);
  }

  if (config.cap && !isValidAmount(config.cap)) {
    errors.push(`Invalid cap: ${config.cap}`);
  }

  if (config.cap && !isValidCap(config.initial_supply, config.cap)) {
    errors.push('Cap must be greater than or equal to initial supply');
  }

  // Validate token metadata
  if (!isValidTokenName(config.name)) {
    errors.push(`Invalid token name (must be 1-100 characters): ${config.name}`);
  }

  if (!isValidTokenSymbol(config.symbol)) {
    errors.push(
      `Invalid token symbol (must be 1-32 uppercase alphanumeric): ${config.symbol}`
    );
  }

  if (!isValidDecimals(config.decimals)) {
    errors.push(`Invalid decimals (must be 0-18): ${config.decimals}`);
  }

  // Validate salt
  if (!isValidSalt(config.salt)) {
    errors.push(`Invalid salt (must be 64-character hex string): ${config.salt}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate MerkleVoting governance configuration
 * @param config - Governance configuration
 * @returns Validation result
 */
export function validateGovernanceConfig(config: {
  governance_type: 'MerkleVoting';
  admin: string;
  root_hash: string;
  salt: string;
}): ValidationResult {
  const errors: string[] = [];

  // Validate admin
  if (!isValidAddress(config.admin)) {
    errors.push(`Invalid admin address: ${config.admin}`);
  }

  // Validate root_hash
  if (!config.root_hash) {
    errors.push('Merkle voting requires root_hash');
  } else if (!isValidSalt(config.root_hash)) {
    errors.push('Invalid root_hash format (must be 64-character hex string)');
  }

  // Validate salt
  if (!isValidSalt(config.salt)) {
    errors.push(`Invalid salt (must be 64-character hex string): ${config.salt}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
