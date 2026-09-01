import { beforeEach, describe, expect, it } from 'vitest';
import { getLastTransactionAccount, rememberTransactionAccount } from './transaction-preferences';

describe('transaction account preference', () => {
  beforeEach(() => localStorage.clear());

  it('returns fallback until an account is remembered', () => {
    expect(getLastTransactionAccount('first-account')).toBe('first-account');
  });

  it('remembers the selected account for the next operation', () => {
    rememberTransactionAccount('second-account');
    expect(getLastTransactionAccount('first-account')).toBe('second-account');
  });

  it('does not replace a valid preference with an empty account', () => {
    rememberTransactionAccount('second-account');
    rememberTransactionAccount('');
    expect(getLastTransactionAccount()).toBe('second-account');
  });
});
