import { describe, it, expect } from 'vitest';
import { normalizeRole } from './user';

describe('normalizeRole', () => {
  it('returns null for empty/undefined', () => {
    expect(normalizeRole(null)).toBeNull();
    expect(normalizeRole(undefined)).toBeNull();
  });

  it('normalizes string roles to lowercase trimmed', () => {
    expect(normalizeRole(' Admin ')).toBe('admin');
    expect(normalizeRole('USER')).toBe('user');
  });

  it('extracts value if role is object with value', () => {
    expect(normalizeRole({ value: 'Admin' })).toBe('admin');
  });
});
